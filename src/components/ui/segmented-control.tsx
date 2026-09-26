'use client';

import * as React from 'react';

import { cn } from '@/utils/cn';

type SegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
  className?: string;
};

/**
 * Choix exclusif en segments (motif APG « radio group ») : un seul arrêt de tabulation sur
 * l'option cochée, flèches pour changer de choix, Début/Fin pour les extrémités (A11Y-11).
 * Segments de 44 px de haut (A11Y-13).
 */
export const SegmentedControl = <T extends string>({ label, value, options, onChange, className }: SegmentedControlProps<T>) => {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const current = Math.max(
    0,
    options.findIndex(([v]) => v === value),
  );

  const select = (index: number) => {
    const next = (index + options.length) % options.length;
    onChange(options[next][0]);
    refs.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const moves: Record<string, number> = {
      ArrowRight: current + 1,
      ArrowDown: current + 1,
      ArrowLeft: current - 1,
      ArrowUp: current - 1,
      Home: 0,
      End: options.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(moves[event.key]);
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('grid rounded border border-ink', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map(([v, text], index) => {
        const checked = v === value;
        return (
          <button
            key={v}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(v)}
            onKeyDown={onKeyDown}
            className={cn('min-h-11 px-4 text-sm', checked ? 'bg-ink text-paper' : 'text-ink hover:bg-surface-2')}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
};
