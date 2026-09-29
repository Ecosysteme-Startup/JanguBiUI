import type * as React from 'react';

import { cn } from '@/utils/cn';

/** Ligne libellé / valeur des encarts (filet haut, 14 ink-2, valeur 15/600). */
export const InfoRow = ({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) => (
  <div
    className={cn(
      'flex items-baseline justify-between gap-3 border-t border-line',
      last ? 'pt-3' : 'py-3',
    )}
  >
    <dt className="text-14 text-ink-2">{label}</dt>
    <dd className="m-0 whitespace-nowrap text-14 text-ink-3">{children}</dd>
  </div>
);
