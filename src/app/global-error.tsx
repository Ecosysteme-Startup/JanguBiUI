'use client';

import { useEffect } from 'react';

import { captureException } from '@/lib/sentry-client';

import '@/styles/globals.css';

type GlobalErrorProps = { error: Error & { digest?: string }; reset: () => void };

/**
 * Erreur dans le layout racine : ni polices ni providers disponibles. Page minimale,
 * mais toujours aux tokens de la charte (palette Ciel par défaut).
 */
const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  useEffect(() => {
    captureException(error);
  }, [error]);
  return (
    <html lang="fr" data-palette="ciel">
      <body className="bg-paper text-ink">
        <main className="mx-auto flex min-h-dvh max-w-reading flex-col justify-center px-4 py-16">
          <p className="tnum m-0 text-meta text-ink-3">Erreur 500</p>
          <h1 className="m-0 mt-3 font-serif text-title font-normal">Jàngu Bi est momentanément indisponible.</h1>
          <p className="mt-4 text-body text-ink-2">Réessayez dans un instant.</p>
          <p className="mt-6">
            <button type="button" onClick={reset} className="h-11 rounded border border-primary-fill bg-primary-fill px-5 text-on-primary">
              Réessayer
            </button>
          </p>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
