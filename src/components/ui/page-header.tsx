import type * as React from 'react';

import { cn } from '@/utils/cn';

/**
 * En-tête de page (maquettes Ciel) : titre Libre Franklin 600 d'une seule couleur, phrase 16 ink2
 * dessous, actions alignées en bas à droite. `app` : 32/40 (espaces connectés). `public` : 40/48.
 * `eyebrow` : courte mention au-dessus du titre (14 ink3 ; `eyebrowTone="primary"` : 15/600 b600,
 * ex. « Erreur 404 »). Jamais de numérotation « 01 — » (retirée de la charte).
 */
export const PageHeader = ({
  eyebrow,
  eyebrowTone = 'muted',
  title,
  description,
  actions,
  children,
  size = 'app',
  className,
}: {
  /** @deprecated Numérotation retirée de la charte Ciel ; ignoré. */
  number?: string;
  eyebrow?: React.ReactNode;
  eyebrowTone?: 'muted' | 'primary';
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  size?: 'app' | 'public';
  className?: string;
}) => (
  <header className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-4', className)}>
    <div className="min-w-0">
      {eyebrow && (
        <p className={cn('m-0 mb-1', eyebrowTone === 'primary' ? 'mb-3 text-15 font-semibold text-primary' : 'text-14 text-ink-3')}>{eyebrow}</p>
      )}
      <h1 className={cn('m-0 font-semibold text-ink', size === 'app' ? 'text-32' : 'text-40')}>{title}</h1>
      {description && <p className={cn('m-0 text-ink-2', size === 'app' ? 'mt-2 text-16' : 'mt-4 text-18')}>{description}</p>}
      {children}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
);
