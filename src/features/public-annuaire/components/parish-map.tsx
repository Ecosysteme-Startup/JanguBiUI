import NextLink from 'next/link';

import { SectionHeading } from '@/components/ui/section-heading';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

import type { DirectoryNode } from '../api/get-directory';

import { parishPlace } from './parish-row';
import { ParishStatus } from './parish-status';

const W = 400;
const H = 300;
const PAD = 32;

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

/**
 * Carte schématique (positions indicatives) des paroisses de la page, et fiche résumée de
 * la paroisse sélectionnée. Chaque point est un lien vers la fiche.
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
    <section aria-labelledby="carte-titre" className={cn('flex flex-col', className)}>
      <SectionHeading id="carte-titre" title="Carte schématique" aside="Positions indicatives" />
      {points.length > 0 ? (
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full border border-line bg-tint-50" role="group" aria-label="Positions des paroisses de la page">
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
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 9 : 6}
                  className={cn(parish.is_active_on_platform ? 'fill-primary' : 'fill-paper', 'stroke-primary')}
                  strokeWidth={isSelected ? 3 : 1.5}
                />
              </a>
            );
          })}
        </svg>
      ) : (
        <p className="m-0 border border-line bg-surface px-4 py-6 text-sm text-ink-2">
          Les positions des paroisses affichées ne sont pas encore renseignées.
        </p>
      )}
      <ul className="tnum m-0 mt-3 flex list-none gap-6 p-0 text-meta text-ink-3">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block size-2.5 rounded-full bg-primary" />
          Active
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block size-2.5 rounded-full border border-primary" />
          Fiche d&apos;annuaire
        </li>
      </ul>
      {selected && (
        <div className="mt-6 border-t border-ink pt-4">
          <p className="tnum m-0 text-meta text-primary">Sélectionnée</p>
          <p className="m-0 mt-2 font-serif text-h3 text-ink">{selected.name}</p>
          {parishPlace(selected) && <p className="m-0 mt-1 text-base text-ink-2">{parishPlace(selected)}</p>}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <ParishStatus active={selected.is_active_on_platform} />
            <NextLink
              href={paths.paroisses.detail.getHref(selected.code)}
              className="hit inline-flex items-center text-base font-medium text-primary underline decoration-1 underline-offset-[5px]"
            >
              Voir la fiche<span className="sr-only"> de {selected.name}</span>
            </NextLink>
          </div>
        </div>
      )}
    </section>
  );
};
