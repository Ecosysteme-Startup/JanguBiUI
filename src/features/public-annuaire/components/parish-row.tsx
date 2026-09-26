import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

import type { DirectoryNode } from '../api/get-directory';
import { sundayMassesLabel } from '../utils/schedule';

import { ParishStatus } from './parish-status';

export const parishPlace = (parish: DirectoryNode) => [parish.address, parish.city].filter(Boolean).join(', ');

/** « Avenue Cheikh Anta Diop, Dakar · Doyenné Plateau-Médina » : adresse et rattachement direct. */
const placeAndParent = (parish: DirectoryNode) => [parishPlace(parish), parish.deanery_name ?? parish.parent_name].filter(Boolean).join(' · ');

const SundayMasses = ({ parish, className }: { parish: DirectoryNode; className?: string }) => {
  const label = sundayMassesLabel(parish.sunday_masses);
  return (
    <span className={cn('tnum text-sm', label ? 'text-ink' : 'text-ink-3', className)}>
      <span className="sr-only">Messes du dimanche : </span>
      {label || 'Non renseignées'}
    </span>
  );
};

/** Ligne de l'annuaire : numéro, nom, adresse et doyenné, messes du dimanche, présence sur Jàngu Bi ; lien vers la fiche. */
export const ParishRow = ({
  parish,
  number,
  selected,
  onSelect,
}: {
  parish: DirectoryNode;
  number: number;
  selected: boolean;
  onSelect: () => void;
}) => (
  <li aria-current={selected ? 'true' : undefined}>
    <NextLink
      href={paths.paroisses.detail.getHref(parish.code)}
      onMouseEnter={onSelect}
      onFocus={onSelect}
      className={cn(
        'grid grid-cols-[40px_minmax(0,1fr)_20px] items-center gap-4 border-b border-line py-4 text-ink hover:bg-surface md:grid-cols-[40px_minmax(0,1fr)_150px_140px_20px]',
        selected && 'bg-surface',
      )}
    >
      <span className="tnum text-meta text-ink-3">{String(number).padStart(2, '0')}</span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-serif text-h4 text-ink">{parish.name}</span>
        {placeAndParent(parish) && <span className="truncate text-sm text-ink-2">{placeAndParent(parish)}</span>}
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 md:hidden">
          <SundayMasses parish={parish} />
          <ParishStatus active={parish.is_active_on_platform} />
        </span>
      </span>
      <SundayMasses parish={parish} className="hidden md:inline" />
      <ParishStatus active={parish.is_active_on_platform} className="hidden md:inline-flex" />
      <Icon name="chevron-droite" size={18} className="text-ink-3" />
    </NextLink>
  </li>
);
