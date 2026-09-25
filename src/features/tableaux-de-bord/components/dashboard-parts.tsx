import type * as React from 'react';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

/** Grand chiffre serif suivi de son commentaire (maquettes DIO/PAR-Tableau-de-bord). */
export const Figure = ({ value, children, size = 'lg' }: { value: React.ReactNode; children?: React.ReactNode; size?: 'xl' | 'lg' }) => (
  <p className="m-0 mb-4 flex items-baseline gap-3">
    <span
      className={cn('tnum font-serif font-normal text-ink', size === 'xl' ? 'text-display' : 'text-[50px] leading-none tracking-tight')}
    >
      {value}
    </span>
    {children && (
      <span className={cn('leading-snug text-ink-2', size === 'xl' ? 'font-serif text-[27px] text-ink' : 'text-sm')}>{children}</span>
    )}
  </p>
);

/** Barre de proportion horizontale (décorative : la valeur est toujours écrite à côté). */
export const Meter = ({ value, max, className }: { value: number; max: number; className?: string }) => (
  <span aria-hidden="true" className={cn('block h-1 bg-tint-50', className)}>
    <span className="block h-1 bg-primary" style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%` }} />
  </span>
);

/** Note de bas de section (confidentialité, provenance des chiffres). */
export const Footnote = ({ children, icon = 'bouclier' }: { children: React.ReactNode; icon?: 'bouclier' | 'info' | 'cadenas' }) => (
  <p className="m-0 mt-auto flex gap-2 pt-3 text-sm leading-snug text-ink-2">
    <Icon name={icon} size={16} className="mt-0.5 shrink-0 text-ink-3" />
    <span>{children}</span>
  </p>
);

/** Section de la grille éditoriale (12 colonnes, span variable). */
export const Panel = ({
  span,
  labelledBy,
  children,
  className,
}: {
  span: 4 | 5 | 7 | 8 | 12;
  labelledBy: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    aria-labelledby={labelledBy}
    className={cn(
      'flex min-w-0 flex-col',
      { 4: 'lg:col-span-4', 5: 'lg:col-span-5', 7: 'lg:col-span-7', 8: 'lg:col-span-8', 12: 'lg:col-span-12' }[span],
      className,
    )}
  >
    {children}
  </section>
);

export const Grid = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12', className)}>{children}</div>
);
