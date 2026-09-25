import * as React from 'react';

import { cn } from '@/utils/cn';

/** Tableau de données (DS-Composants §06) : en-tête 40 px, lignes 56 px, sélection bleu-50. */
export const Table = ({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-x-auto">
    <table className={cn('w-full border-collapse text-sm text-ink', className)} {...props} />
  </div>
);

export const Th = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    scope="col"
    className={cn('tnum h-10 border-b border-line-strong pr-4 text-left text-meta font-medium text-ink-3 last:pr-0', className)}
    {...props}
  />
);

export const Tr = ({ className, selected, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) => (
  <tr
    aria-selected={selected || undefined}
    className={cn(selected ? 'bg-tint-50' : 'hover:bg-surface-2', className)}
    {...props}
  />
);

export const Td = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('h-14 border-b border-line pr-4 align-middle last:pr-0', className)} {...props} />
);
