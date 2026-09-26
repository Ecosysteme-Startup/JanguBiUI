'use client';

import NextLink from 'next/link';
import * as React from 'react';

import { cn } from '@/utils/cn';

/**
 * Contrôle segmenté (WEB-Design-System ; WEB-FID-Parole « Du jour / Bible / Chapelet ») :
 * piste surface2 rayon 12, segment choisi en carte (fond paper, ombre carte, 600), 3 choix max.
 * `md` : segments 34 px, 14 px (filtres). `lg` : segments 36 px, 15 px (sous-navigation de page).
 */
type SegmentSize = 'md' | 'lg';

const trackClass = (size: SegmentSize) =>
  cn('inline-flex max-w-full flex-wrap gap-0.5 rounded-12 bg-surface-2', size === 'lg' ? 'p-1' : 'p-[3px]');

const segmentClass = (size: SegmentSize, checked: boolean) =>
  cn(
    'hit inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-9 transition-colors',
    size === 'lg' ? 'h-9 px-4 text-15' : 'h-[34px] px-[18px] text-14',
    checked ? 'bg-paper font-semibold text-ink shadow-card' : 'font-medium text-ink-2 hover:text-ink',
  );

type SegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
  size?: SegmentSize;
  className?: string;
};

/**
 * Choix exclusif en segments (motif APG « radio group ») : un seul arrêt de tabulation sur
 * l'option cochée, flèches pour changer de choix, Début/Fin pour les extrémités (A11Y-11).
 * Cible de 44 px par `hit` (A11Y-13).
 */
export const SegmentedControl = <T extends string>({ label, value, options, onChange, size = 'md', className }: SegmentedControlProps<T>) => {
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
      className={cn(trackClass(size), className)}
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
            className={segmentClass(size, checked)}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
};

/** Variante navigation : chaque segment est un lien, la page courante porte `aria-current`. */
export const SegmentedLinks = ({
  label,
  items,
  size = 'lg',
  className,
}: {
  label: string;
  items: { href: string; label: string; active: boolean }[];
  size?: SegmentSize;
  className?: string;
}) => (
  <nav aria-label={label} className={cn(trackClass(size), className)}>
    {items.map((item) => (
      <NextLink
        key={item.href}
        href={item.href}
        aria-current={item.active ? 'page' : undefined}
        className={cn(segmentClass(size, item.active), 'hover:no-underline')}
      >
        {item.label}
      </NextLink>
    ))}
  </nav>
);
