import type * as React from 'react';

import { cn } from '@/utils/cn';

/**
 * En-tête d'écran du back-office (maquettes DIO-*, PLA-*) : légende numérotée,
 * titre serif 40 px, actions à droite.
 */
export const PageHeader = ({
  number,
  eyebrow,
  title,
  actions,
  children,
  className,
}: {
  number?: string;
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) => (
  <header className={cn('flex flex-wrap items-end justify-between gap-6', className)}>
    <div className="min-w-0">
      <p className="tnum m-0 text-meta text-ink-2">
        {number && <span className="text-primary">{number}</span>}
        {number && ' — '}
        {eyebrow}
      </p>
      <h1 className="m-0 mt-2 font-serif text-title font-normal text-ink">{title}</h1>
      {children}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
  </header>
);
