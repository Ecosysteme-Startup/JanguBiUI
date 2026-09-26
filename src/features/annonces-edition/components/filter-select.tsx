import type * as React from 'react';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

/**
 * Filtre en pilule (PAR-Annonces : « Catégorie ⌄ », « Lieu ⌄ ») sur un <select> natif.
 * Au repos, la pilule affiche le nom du filtre ; un filtre actif passe en b100.
 * En attendant une primitive partagée (demande aux fondations, lot F).
 */
export const FilterSelect = ({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) => (
  <span className="relative inline-flex shrink-0">
    <label htmlFor={id} className="sr-only">
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'hit h-9 max-w-56 cursor-pointer [field-sizing:content] appearance-none truncate rounded-full border pl-3.5 pr-8 text-14 transition-colors',
        value
          ? 'border-tint-100 bg-tint-100 font-semibold text-tint-900'
          : 'border-line bg-paper font-medium text-ink hover:border-line-field hover:bg-surface',
      )}
    >
      {children}
    </select>
    <Icon name="chevron-bas" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3" />
  </span>
);
