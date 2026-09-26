import * as React from 'react';

import { cn } from '@/utils/cn';

import { Icon } from './icon';
import { ScrollRegion } from './scroll-region';

type TableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  /** Nom de la zone de défilement quand le tableau est plus large que l'écran (A11Y-12). */
  label?: string;
  /** Tableau encadré (carte rayon 16, bordure line) : le cas des files du back-office. */
  framed?: boolean;
};

/**
 * Tableau de données (WEB-Design-System, « Table et pagination ») : en-tête 44 px fond surface,
 * 13/500 ink2 ; rangées 60 px, 14/20, filet line, survol surface, sélection b50. Le retard se
 * signale par le délai (<DelayBadge>), jamais par une ligne colorée. En petite largeur, il défile
 * dans sa propre zone (jamais la page) ; cette zone devient focalisable et nommée dès qu'elle déborde.
 */
export const Table = ({ className, label = 'Tableau, défilement horizontal', framed = false, ...props }: TableProps) => {
  const table = <table className={cn('w-full border-collapse text-14 text-ink', className)} {...props} />;
  return framed ? (
    <div className="overflow-hidden rounded-16 border border-line bg-paper">
      <ScrollRegion label={label}>{table}</ScrollRegion>
    </div>
  ) : (
    <ScrollRegion label={label}>{table}</ScrollRegion>
  );
};

export const Th = ({
  className,
  sort,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { sort?: 'ascending' | 'descending' }) => (
  <th
    scope="col"
    aria-sort={sort}
    className={cn(
      'h-11 whitespace-nowrap border-b border-line bg-surface pr-4 text-left text-13 font-medium text-ink-2 first:pl-5 last:pr-3',
      sort && 'font-semibold text-ink',
      className,
    )}
    {...props}
  >
    {sort ? (
      <span className="inline-flex items-center gap-1">
        {children}
        {/* Maquettes (PAR-Demandes, PAR-Annonces, DIO-Nominations) : décroissant = ↓. */}
        <Icon name={sort === 'descending' ? 'fleche-bas' : 'fleche-haut'} size={14} strokeWidth={2} />
      </span>
    ) : (
      children
    )}
  </th>
);

export const Tr = ({ className, selected, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) => (
  <tr aria-selected={selected || undefined} className={cn(selected ? 'bg-tint-50' : 'hover:bg-surface', className)} {...props} />
);

export const Td = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('h-15 border-b border-line py-2 pr-4 align-middle first:pl-5 last:pr-3', className)} {...props} />
);

/** Barre d'actions groupées (fond b50) au-dessus du tableau : « 2 demandes sélectionnées ». */
export const TableSelectionBar = ({ children, actions, className }: { children: React.ReactNode; actions?: React.ReactNode; className?: string }) => (
  <div className={cn('flex min-h-13 flex-wrap items-center justify-between gap-3 border-b border-line bg-tint-50 px-5 py-2', className)}>
    <p className="m-0 text-14 font-semibold text-ink">{children}</p>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
