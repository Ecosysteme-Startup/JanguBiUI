'use client';

import { useEffect } from 'react';

import { Logo } from '@/components/ui/logo';
import { captureException } from '@/lib/sentry-client';

import '@/styles/globals.css';

type GlobalErrorProps = { error: Error & { digest?: string }; reset: () => void };

/**
 * Erreur dans le layout racine : ni polices ni providers disponibles. Page minimale,
 * mais toujours aux jetons de la charte « Ciel produit ».
 */
const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  useEffect(() => {
    captureException(error);
  }, [error]);
  return (
    <html lang="fr">
      <body className="bg-paper text-ink">
        <main className="mx-auto flex min-h-dvh max-w-reading flex-col justify-center px-4 py-16">
          <Logo size={40} />
          <p className="tnum m-0 mt-8 text-meta text-ink-3">Erreur 500</p>
          <h1 className="m-0 mt-3 text-32 font-semibold">Jàngu Bi est momentanément indisponible.</h1>
          <p className="mt-4 text-body text-ink-2">Réessayez dans un instant.</p>
          <p className="mt-6">
            <button type="button" onClick={reset} className="h-10 rounded-12 bg-primary-fill px-4 text-15 font-semibold text-on-primary hover:bg-primary-fill-hover">
              Réessayer
            </button>
          </p>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
