import type { ReactNode } from 'react';

import { CenteredShell } from '@/components/layouts/auth-shell';

type ErrorScreenProps = { code: string; title: string; children: ReactNode; actions: ReactNode };

/**
 * Écrans d'erreur hors coquille (500, connexion interrompue) : carte centrée de WEB-Connexion.
 * La 404 a sa propre page dans la coquille publique (src/app/not-found.tsx, WEB-Erreur-404).
 */
export const ErrorScreen = ({ code, title, children, actions }: ErrorScreenProps) => (
  <CenteredShell>
    <p className="m-0 text-15 font-semibold text-primary">{code}</p>
    <h1 className="m-0 mt-2 text-24 font-semibold text-ink">{title}</h1>
    <div className="mt-2 text-15 text-ink-2">{children}</div>
    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-15 font-semibold">{actions}</div>
  </CenteredShell>
);
