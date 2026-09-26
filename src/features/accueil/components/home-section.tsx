import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

/**
 * Bloc de l'accueil (FID-Accueil) : titre 20/28 600 et lien discret 15/500 à droite
 * (« Toutes mes demandes », « Horaires »), contenu 16 px dessous.
 */
export const HomeSection = ({
  id,
  title,
  action,
  children,
  className,
}: {
  id: string;
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <section aria-labelledby={id} className={cn('min-w-0', className)}>
    <div className="flex items-baseline justify-between gap-4">
      <h2 id={id} className="m-0 text-20 font-semibold text-ink">
        {title}
      </h2>
      {action && <span className="shrink-0 text-15 font-medium">{action}</span>}
    </div>
    <div className="mt-4">{children}</div>
  </section>
);
