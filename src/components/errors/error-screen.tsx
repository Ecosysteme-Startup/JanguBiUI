import type { ReactNode } from 'react';

type ErrorScreenProps = { code: string; title: string; children: ReactNode; actions: ReactNode };

/** Pages d'erreur 403, 404, 500 aux couleurs de la charte (sobres, sans shell). */
export const ErrorScreen = ({ code, title, children, actions }: ErrorScreenProps) => (
  <main id="contenu" className="mx-auto flex min-h-dvh max-w-reading flex-col justify-center px-4 py-16">
    <p className="tnum m-0 text-meta text-ink-3">{code}</p>
    <h1 className="m-0 mt-3 font-serif text-title font-normal text-ink">{title}</h1>
    <div className="mt-4 text-body text-ink-2">{children}</div>
    <div className="mt-6 flex flex-wrap items-center gap-6">{actions}</div>
  </main>
);
