'use client';

import NextLink from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { frenchTypo } from '@/utils/french-typo';

import type { DirectoryNode } from '../api/get-directory';
import { useNodeWeek } from '../api/get-node-week';
import { useNow } from '../hooks/use-parish-now';
import { nextMassPhrase, sundayMassesLabel, upcomingMasses } from '../utils/schedule';

export const parishPlace = (parish: DirectoryNode) => [parish.address, parish.city].filter(Boolean).join(', ');

/** « Point E, Dakar · doyenné Plateau-Médina ». */
export const placeAndDeanery = (parish: DirectoryNode) =>
  [parishPlace(parish), parish.deanery_name ? `doyenné ${parish.deanery_name.replace(/^Doyenné\s+/i, '')}` : parish.parent_name]
    .filter(Boolean)
    .join(' · ');

/** Prochaine messe d'une paroisse ouverte (horaires publiés), sinon ses messes du dimanche. */
const MassLine = ({ parish, selected }: { parish: DirectoryNode; selected: boolean }) => {
  const now = useNow();
  const { data } = useNodeWeek(parish.is_active_on_platform ? parish.id : '');
  const next = data && now ? upcomingMasses(data.occurrences, now.today, now.time)[0] : undefined;
  if (next && now) {
    return (
      <span className={cn('tnum mt-1.5 flex items-center gap-1.5 text-14', selected ? 'text-tint-800' : 'text-ink-2')}>
        <Icon name="horloge" size={16} className="shrink-0" />
        {frenchTypo(`Prochaine messe ${nextMassPhrase(next, now.today)}`)}
      </span>
    );
  }
  const sunday = sundayMassesLabel(parish.sunday_masses);
  if (!sunday) return null;
  return (
    <span className="tnum mt-1.5 block text-14 text-ink-2">
      <span className="text-ink-3">Messes du dimanche : </span>
      {sunday}
    </span>
  );
};

/**
 * Rangée de l'annuaire (WEB-Paroisses) : repère, nom, lieu et doyenné, prochaine messe (ou messes
 * du dimanche) ; « Sur Jàngu Bi » ou « Annuaire diocésain ». Lien vers la fiche ; le survol et le
 * focus la sélectionnent sur la carte.
 */
export const ParishRow = ({ parish, selected, onSelect, last }: { parish: DirectoryNode; selected: boolean; onSelect: () => void; last: boolean }) => (
  <li className={cn(!last && 'border-b border-line')}>
    <NextLink
      href={paths.paroisses.detail.getHref(parish.code)}
      aria-current={selected ? 'true' : undefined}
      onMouseEnter={onSelect}
      onFocus={onSelect}
      className={cn('flex items-start gap-3.5 px-5 py-4 text-ink hover:text-ink', selected ? 'bg-tint-50' : 'hover:bg-surface')}
    >
      <Icon name="pin" size={20} className={cn('mt-0.5 shrink-0', selected || parish.is_active_on_platform ? 'text-primary' : 'text-ink-3')} />
      <span className="min-w-0 flex-1">
        <span className="block text-16 font-semibold">{parish.name.replace(/^Paroisse\s+/i, '')}</span>
        {placeAndDeanery(parish) && <span className="block text-14 text-ink-2">{placeAndDeanery(parish)}</span>}
        <MassLine parish={parish} selected={selected} />
      </span>
      {parish.is_active_on_platform ? (
        <Badge tone="ok" className="font-medium">
          Sur Jàngu Bi
        </Badge>
      ) : (
        <span className="shrink-0 text-13 leading-6 text-ink-3">Annuaire diocésain</span>
      )}
    </NextLink>
  </li>
);
