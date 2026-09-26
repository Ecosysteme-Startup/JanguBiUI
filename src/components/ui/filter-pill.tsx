import type * as React from 'react';

import { cn } from '@/utils/cn';

import { Icon } from './icon';

type FilterPillProps = {
  id: string;
  /** Nom accessible du filtre. */
  label: string;
  /** Libellé affiché quand le filtre est inactif (première option, valeur vide). */
  allLabel: string;
  value: string;
  onChange: (value: string) => void;
  /** Croix de retrait quand le filtre est actif. */
  onClear?: () => void;
  children: React.ReactNode;
};

/**
 * Pilule de filtre-sélecteur (WEB-PAR-Demandes : « Type d'acte ⌄ », « Suivie par ⌄ ») : sélecteur
 * natif 36 px rayon 999, largeur au contenu. Inactif : contour line ; actif : b50, filet b200, texte b800,
 * croix de retrait si `onClear`.
 */
export const FilterPill = ({ id, label, allLabel, value, onChange, onClear, children }: FilterPillProps) => (
  <span className="relative inline-flex shrink-0">
    <label htmlFor={id} className="sr-only">
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'hit h-9 max-w-full cursor-pointer appearance-none rounded-full border pl-3.5 text-14 font-medium transition-colors [field-sizing:content]',
        value && onClear ? 'pr-14' : 'pr-8',
        value ? 'border-line-active bg-tint-50 text-tint-800' : 'border-line bg-paper text-ink hover:border-line-field hover:bg-surface',
      )}
    >
      <option value="">{allLabel}</option>
      {children}
    </select>
    <Icon
      name="chevron-bas"
      size={16}
      className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2', value && onClear ? 'right-8' : 'right-3', value ? 'text-tint-800' : 'text-ink-3')}
    />
    {value && onClear && (
      <button
        type="button"
        onClick={onClear}
        aria-label={`Retirer le filtre ${label.toLowerCase()}`}
        className="absolute right-1.5 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-tint-800 hover:bg-tint-100"
      >
        <Icon name="x" size={14} />
      </button>
    )}
  </span>
);
