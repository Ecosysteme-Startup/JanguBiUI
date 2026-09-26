import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

type SettingsCardProps = {
  id: string;
  title: string;
  description?: ReactNode;
  /** Barre d'actions en bas de carte, sur fond surface (Annuler / Enregistrer). */
  footer?: ReactNode;
  tone?: 'default' | 'danger';
  className?: string;
  children?: ReactNode;
};

/**
 * Carte d'une section de réglages (FID-Profil) : rayon 16, titre 22/30, contenu à 32 px des bords
 * (20 px sur mobile). L'ancre `id` sert à la navigation « Réglages ».
 */
export const SettingsCard = ({ id, title, description, footer, tone = 'default', className, children }: SettingsCardProps) => (
  <section
    id={id}
    aria-labelledby={`${id}-titre`}
    className={cn('scroll-mt-6 rounded-16 border border-line bg-paper', tone === 'default' && 'shadow-card', className)}
  >
    <div className="px-5 pb-6 pt-6 sm:px-8">
      <h2 id={`${id}-titre`} className={cn('m-0 font-semibold', tone === 'danger' ? 'text-18 text-err' : 'text-22 text-ink')}>
        {title}
      </h2>
      {description && <div className="m-0 mt-1 text-15 text-ink-2">{description}</div>}
      {children}
    </div>
    {footer && (
      <div className="flex flex-wrap items-center justify-end gap-4 rounded-b-16 border-t border-line bg-surface px-5 py-4 sm:px-8">{footer}</div>
    )}
  </section>
);

/** Rangée « intitulé + explication » avec une action à droite (mot de passe, export…). */
export const SettingsRow = ({ title, children, action, className }: { title: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) => (
  <div className={cn('flex flex-wrap items-center justify-between gap-4', className)}>
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="text-15 font-semibold text-ink">{title}</span>
      {children && <span className="text-14 text-ink-3">{children}</span>}
    </span>
    {action && <span className="shrink-0">{action}</span>}
  </div>
);
