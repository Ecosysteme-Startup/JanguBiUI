'use client';

import { Link } from '@/components/ui/link/link';
import { cn } from '@/utils/cn';

interface OngletsProps {
  actif: string;
  onglets: { cle: string; libelle: string; href: string }[];
  className?: string;
}

/** Onglets de section (« Opérations · Analyse »), en liens de navigation. */
export function Onglets({ actif, onglets, className }: OngletsProps) {
  return (
    <nav aria-label="Vues" className={cn('border-b border-border', className)}>
      <ul className="flex gap-6">
        {onglets.map((o) => {
          const courant = o.cle === actif;
          return (
            <li key={o.cle}>
              <Link
                href={o.href}
                aria-current={courant ? 'page' : undefined}
                className={cn(
                  '-mb-px inline-block border-b-2 pb-2.5 text-sm font-medium no-underline hover:no-underline',
                  courant
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {o.libelle}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
