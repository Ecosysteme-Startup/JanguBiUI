import * as React from 'react';

import { cn } from '@/utils/cn';

import { Icon } from './icon';

type ChipProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> & {
  pressed: boolean;
  /** Compteur tabulaire après le libellé. */
  count?: number;
  /**
   * `ink` (défaut) : filtre exclusif, actif en aplat d'encre (« À traiter 4 »).
   * `tint` : filtre cumulable, actif en b100 avec une coche (« ✓ Baptême »).
   */
  tone?: 'ink' | 'tint';
};

/** Pilule de filtre (WEB-Design-System, « Pilules de filtre ») : 36 px, rayon 999, 14 px. */
export const Chip = ({ pressed, count, tone = 'ink', className, children, type = 'button', ...props }: ChipProps) => (
  <button
    type={type}
    aria-pressed={pressed}
    className={cn(
      'hit inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-14 transition-colors',
      !pressed && 'border-line bg-paper font-medium text-ink hover:border-line-field hover:bg-surface',
      pressed && tone === 'ink' && 'border-inverse bg-inverse font-semibold text-on-inverse',
      pressed && tone === 'tint' && 'border-tint-100 bg-tint-100 pl-2.5 font-semibold text-tint-900',
      className,
    )}
    {...props}
  >
    {pressed && tone === 'tint' && <Icon name="check" size={16} strokeWidth={2.25} />}
    {children}
    {count !== undefined && (
      <span className={cn('tnum', pressed ? (tone === 'ink' ? 'font-semibold text-on-inverse-muted' : '') : 'font-normal text-ink-3')}>
        {count}
      </span>
    )}
  </button>
);

export const ChipGroup = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
  <div role="group" aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
    {children}
  </div>
);
