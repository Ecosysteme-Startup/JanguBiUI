'use client';

import NextLink from 'next/link';
import * as React from 'react';

import { cn } from '@/utils/cn';

/**
 * Contrôle segmenté (WEB-Design-System ; WEB-FID-Parole « Du jour / Bible / Chapelet ») :
 * piste surface2 rayon 12, segment choisi en carte (fond paper, ombre carte, 600), 3 choix max.
 * `xs` : 32 px, 14 px (FID-Conversation) · `sm` : 36 px, 14 px (FID-Pretres, PAR-Messagerie) ·
 * `md` : 34 px, 14 px (filtres, défaut) · `lg` : 36 px, 15 px (sous-navigation de page, FID-Parole).
 * `block` : piste pleine largeur, segments de largeur égale.
 */
type SegmentSize = 'xs' | 'sm' | 'md' | 'lg';

const SEGMENT_SIZE: Record<SegmentSize, string> = {
  xs: 'h-8 px-3.5 text-14',
  sm: 'h-9 px-4 text-14',
  md: 'h-[34px] px-[18px] text-14',
  lg: 'h-9 px-4 text-15',
};

const trackClass = (size: SegmentSize, block = false) =>
  cn('max-w-full flex-wrap gap-0.5 rounded-12 bg-surface-2', block ? 'grid auto-cols-fr grid-flow-col' : 'inline-flex', size === 'lg' ? 'p-1' : 'p-[3px]');

const segmentClass = (size: SegmentSize, checked: boolean) =>
  cn(
    'hit inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-9 transition-colors',
    SEGMENT_SIZE[size],
    checked ? 'bg-paper font-semibold text-ink shadow-card' : 'font-medium text-ink-2 hover:text-ink',
  );

type SegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
  size?: SegmentSize;
  block?: boolean;
  /** Compteurs par valeur (« Sans réponse 3 »). */
  counts?: Partial<Record<T, number>>;
  className?: string;
};

/**
 * Choix exclusif en segments (motif APG « radio group ») : un seul arrêt de tabulation sur
 * l'option cochée, flèches pour changer de choix, Début/Fin pour les extrémités (A11Y-11).
 * Cible de 44 px par `hit` (A11Y-13).
 */
export const SegmentedControl = <T extends string>({ label, value, options, onChange, size = 'md', block, counts, className }: SegmentedControlProps<T>) => {
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
      className={cn(trackClass(size, block), className)}
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
            {counts?.[v] !== undefined && <span className="tnum font-medium text-ink-3">{counts[v]}</span>}
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
  block,
  className,
}: {
  label: string;
  items: { href: string; label: string; active: boolean; count?: number }[];
  size?: SegmentSize;
  block?: boolean;
  className?: string;
}) => (
  <nav aria-label={label} className={cn(trackClass(size, block), className)}>
    {items.map((item) => (
      <NextLink
        key={item.href}
        href={item.href}
        aria-current={item.active ? 'page' : undefined}
        className={cn(segmentClass(size, item.active), 'hover:no-underline')}
      >
        {item.label}
        {item.count !== undefined && <span className="tnum font-medium text-ink-3">{item.count}</span>}
      </NextLink>
    ))}
  </nav>
);
