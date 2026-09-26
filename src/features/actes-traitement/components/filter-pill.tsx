import type * as React from 'react';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

type FilterPillProps = {
  id: string;
  /** Nom accessible du filtre. */
  label: string;
  /** Libellé affiché quand le filtre est inactif (première option). */
  allLabel: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
};

/**
 * Filtre de la file en pilule (maquette PAR-Demandes) : sélecteur natif, 36 px, rayon 999.
 * Inactif : contour line ; actif : fond b50, filet b200, texte b800.
 */
export const FilterPill = ({ id, label, allLabel, value, onChange, children }: FilterPillProps) => (
  <span className="relative inline-flex shrink-0">
    <label htmlFor={id} className="sr-only">
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'hit h-9 max-w-full cursor-pointer appearance-none rounded-full [field-sizing:content] border pl-3.5 pr-8 text-14 font-medium transition-colors',
        value ? 'border-line-active bg-tint-50 text-tint-800' : 'border-line bg-paper text-ink hover:border-line-field hover:bg-surface',
      )}
    >
      <option value="">{allLabel}</option>
      {children}
    </select>
    <Icon
      name="chevron-bas"
      size={16}
      className={cn('pointer-events-none absolute right-3 top-1/2 -translate-y-1/2', value ? 'text-tint-800' : 'text-ink-3')}
    />
  </span>
);
