'use client';

import NextLink from 'next/link';
import { useEffect } from 'react';


import { ErrorScreen } from '@/components/errors/error-screen';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { captureException } from '@/lib/sentry-client';

type ErrorPageProps = { error: Error & { digest?: string }; reset: () => void };

/** Erreur 500 dans une page : on propose de réessayer ; l'erreur part à Sentry (filtrée). */
const ErrorPage = ({ error, reset }: ErrorPageProps) => {
  useEffect(() => {
    captureException(error);
  }, [error]);
  return (
    <ErrorScreen
      code="Erreur 500"
      title="Un incident nous empêche d’afficher cette page."
      actions={
        <>
          <Button onClick={reset}>Réessayer</Button>
          <NextLink href={paths.home.getHref()}>Revenir à l&apos;accueil</NextLink>
        </>
      }
    >
      <p className="m-0">Vos données ne sont pas perdues. Réessayez dans un instant ; si cela se reproduit, l&apos;équipe Numerisen est déjà prévenue.</p>
      {error.digest && <p className="tnum mt-3 text-meta text-ink-3">Référence : {error.digest}</p>}
    </ErrorScreen>
  );
};

export default ErrorPage;
