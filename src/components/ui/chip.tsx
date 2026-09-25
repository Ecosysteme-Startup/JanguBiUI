import * as React from 'react';

import { cn } from '@/utils/cn';

type ChipProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> & { pressed: boolean };

/** Filtre (DS-Composants §05) : 32 px, encre pleine quand actif. */
export const Chip = ({ pressed, className, type = 'button', ...props }: ChipProps) => (
  <button
    type={type}
    aria-pressed={pressed}
    className={cn(
      'inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded border px-3 text-sm transition-colors',
      pressed ? 'border-ink bg-ink text-paper' : 'border-line bg-transparent text-ink hover:border-ink',
      className,
    )}
    {...props}
  />
);

export const ChipGroup = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
  <div role="group" aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
    {children}
  </div>
);
