import type * as React from 'react';

import { cn } from '@/utils/cn';

/**
 * Carte de réglages (PAR-Parametres) : rayon 16, titre 20/600 et phrase 14 ink3 (20/24/0),
 * contenu (20/24/24), pied optionnel sur fond surface avec l'état d'enregistrement.
 */
export const SettingsCard = ({
  id,
  title,
  description,
  aside,
  footer,
  children,
  className,
}: {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  aside?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <section aria-labelledby={id} className={cn('min-w-0 overflow-hidden rounded-16 border border-line bg-paper shadow-card', className)}>
    <div className="flex items-start justify-between gap-4 px-6 pt-5">
      <div className="min-w-0">
        <h2 id={id} className="m-0 text-20 font-semibold text-ink">
          {title}
        </h2>
        {description && <p className="m-0 mt-0.5 text-14 text-ink-3">{description}</p>}
      </div>
      {aside && <div className="shrink-0 pt-1 text-14 font-semibold">{aside}</div>}
    </div>
    <div className="px-6 pb-6 pt-5">{children}</div>
    {footer && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-6 py-4">{footer}</div>}
  </section>
);
