import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import type { FundKind } from '../../types/schemas';

/** Pilules par type de fonds (l'API ne filtre que par fonds : filtre appliqué côté client). */
export const KIND_FILTERS = [
  { value: 'tous', label: 'Tous', kinds: null },
  {
    value: 'quetes',
    label: 'Quêtes',
    kinds: ['quete_dominicale', 'quete_imperee'],
  },
  { value: 'campagnes', label: 'Campagnes', kinds: ['campagne'] },
  {
    value: 'contribution',
    label: 'Contribution',
    kinds: ['contribution_annuelle'],
  },
] as const satisfies readonly {
  value: string;
  label: string;
  kinds: readonly FundKind[] | null;
}[];

export type KindFilter = (typeof KIND_FILTERS)[number]['value'];

export const matchesKind = (kind: string, filter: KindFilter): boolean => {
  const kinds = KIND_FILTERS.find((f) => f.value === filter)?.kinds;
  return !kinds || (kinds as readonly string[]).includes(kind);
};

/** Pilules 40 px (WEB-FID-Mes-Dons) : active b50, filet primaire, coche ; sinon paper, filet line. */
export const KindFilters = ({
  value,
  onChange,
}: {
  value: KindFilter;
  onChange: (value: KindFilter) => void;
}) => (
  <div role="group" aria-label="Type de fonds" className="flex flex-wrap gap-2">
    {KIND_FILTERS.map((f) => {
      const pressed = f.value === value;
      return (
        <button
          key={f.value}
          type="button"
          aria-pressed={pressed}
          onClick={() => onChange(f.value)}
          className={cn(
            'hit inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-15 transition-colors',
            pressed
              ? 'border-primary bg-tint-50 font-semibold text-tint-800'
              : 'border-line bg-paper text-ink hover:border-line-field hover:bg-surface',
          )}
        >
          {pressed && <Icon name="check" size={16} strokeWidth={2} />}
          {f.label}
        </button>
      );
    })}
  </div>
);

/** Sélecteur d'année (`?annee=`) : l'année en cours et les deux précédentes. */
export const YearSelect = ({
  year,
  onChange,
}: {
  year: number;
  onChange: (year: number) => void;
}) => {
  const current = dayjs().year();
  const years = [
    ...new Set([
      Math.max(current, year),
      current,
      current - 1,
      current - 2,
      year,
    ]),
  ].sort((a, b) => b - a);
  return (
    <label className="inline-flex items-center gap-2.5 text-14 text-ink-2">
      Année
      <span className="relative inline-flex">
        <select
          value={year}
          onChange={(e) => onChange(Number(e.target.value))}
          className="tnum h-10 appearance-none rounded-12 border border-line-field bg-surface pl-3.5 pr-10 text-15 font-medium text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-bas"
          size={18}
          className="pointer-events-none absolute right-3 top-[11px] text-ink-2"
        />
      </span>
    </label>
  );
};
