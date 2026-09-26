'use client';

import NextLink from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

import type { DirectoryNode } from '../api/get-directory';
import { useNodeWeek } from '../api/get-node-week';
import { useNow } from '../hooks/use-parish-now';
import { slotWhen, upcomingMasses } from '../utils/schedule';

import { MassSlot } from './mass-slot';
import { parishPlace } from './parish-row';
import { ParishStatus } from './parish-status';

const W = 520;
const H = 640;
const PAD = 72;

type Point = { parish: DirectoryNode; x: number; y: number };

const toNumber = (value: DirectoryNode['lat']) => (value === null || value === undefined || value === '' ? NaN : Number(value));

/** Projection équirectangulaire des positions connues dans le cadre de la carte. */
export const projectParishes = (parishes: DirectoryNode[]): Point[] => {
  const located = parishes
    .map((parish) => ({ parish, lat: toNumber(parish.lat), lng: toNumber(parish.lng) }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (located.length === 0) return [];
  const lats = located.map((p) => p.lat);
  const lngs = located.map((p) => p.lng);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const span = Math.max(maxLat - minLat, maxLng - minLng, 0.01);
  const scale = Math.min((W - 2 * PAD) / span, (H - 2 * PAD) / span);
  const cx = (minLng + maxLng) / 2;
  const cy = (minLat + maxLat) / 2;
  return located.map(({ parish, lat, lng }) => ({ parish, x: W / 2 + (lng - cx) * scale, y: H / 2 - (lat - cy) * scale }));
};

/** Carte flottante de la paroisse sélectionnée : nom, adresse, prochaine messe, lien vers la fiche. */
const SelectedCard = ({ parish }: { parish: DirectoryNode }) => {
  const now = useNow();
  const { data } = useNodeWeek(parish.is_active_on_platform ? parish.id : '');
  const next = data && now ? upcomingMasses(data.occurrences, now.today, now.time)[0] : undefined;
  return (
    <div className="absolute bottom-4 left-4 right-4 rounded-16 border border-line bg-paper p-4 shadow-menu sm:right-auto sm:w-[272px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-16 font-semibold text-ink">{parish.name.replace(/^Paroisse\s+/i, '')}</span>
        <ParishStatus active={parish.is_active_on_platform} />
      </div>
      {parishPlace(parish) && <div className="text-14 text-ink-2">{parishPlace(parish)}</div>}
      {next && now && <MassSlot occurrence={next} when={slotWhen(next, now.today, now.time)} tone="next" className="mt-3" />}
      <NextLink href={paths.paroisses.detail.getHref(parish.code)} className={cn(buttonVariants({ variant: 'outline' }), 'mt-3 w-full')}>
        Voir la fiche de la paroisse
      </NextLink>
    </div>
  );
};

/**
 * Carte schématique (positions indicatives) des paroisses de la page (WEB-Paroisses) : chaque
 * point mène à la fiche ; la paroisse sélectionnée est résumée en bas à gauche.
 */
export const ParishMap = ({
  parishes,
  selected,
  onSelect,
  className,
}: {
  parishes: DirectoryNode[];
  selected?: DirectoryNode;
  onSelect: (id: string) => void;
  className?: string;
}) => {
  const points = projectParishes(parishes);
  return (
    <section aria-label="Carte des paroisses" className={className}>
      <div className="relative h-[480px] overflow-hidden rounded-16 border border-line bg-tint-50 lg:h-[640px]">
        {points.length > 0 ? (
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full" role="group" aria-label="Positions indicatives des paroisses de la page">
            {points.map(({ parish, x, y }) => {
              const isSelected = parish.id === selected?.id;
              return (
                <a
                  key={parish.id}
                  href={paths.paroisses.detail.getHref(parish.code)}
                  aria-label={parish.name}
                  onMouseEnter={() => onSelect(parish.id)}
                  onFocus={() => onSelect(parish.id)}
                >
                  {isSelected && <circle cx={x} cy={y} r={16} className="fill-tint-200 opacity-60" />}
                  {parish.is_active_on_platform ? (
                    <circle cx={x} cy={y} r={isSelected ? 8 : 6} className="fill-primary-fill stroke-paper" strokeWidth={3} />
                  ) : (
                    <circle cx={x} cy={y} r={5} className="fill-ink-4" />
                  )}
                </a>
              );
            })}
          </svg>
        ) : (
          <p className="absolute inset-x-6 top-6 m-0 text-14 text-ink-2">Les positions des paroisses affichées ne sont pas encore renseignées.</p>
        )}
        {selected && <SelectedCard parish={selected} />}
      </div>
      <ul className="m-0 mt-3 flex list-none flex-wrap items-center gap-5 p-0 text-13 text-ink-2">
        <li className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-3 rounded-full bg-primary-fill" />
          Sur Jàngu Bi
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-2.5 rounded-full bg-ink-4" />
          Annuaire diocésain
        </li>
      </ul>
      <p className="m-0 mt-4 flex gap-2.5 rounded-12 border border-line bg-surface px-4 py-3.5 text-14 text-ink-2">
        <Icon name="info" size={18} className="mt-px shrink-0 text-ink-3" />
        <span>
          Votre paroisse n&apos;y est pas encore&nbsp;? Le curé peut{' '}
          <NextLink href={paths.pourLesParoisses.getHref()} className="font-semibold">
            demander une présentation de Jàngu Bi
          </NextLink>
          .
        </span>
      </p>
    </section>
  );
};
