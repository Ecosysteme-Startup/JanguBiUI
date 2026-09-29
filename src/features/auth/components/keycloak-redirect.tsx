'use client';

import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { env } from '@/config/env';
import { paths } from '@/config/paths';
import { startLogin, startRegister } from '@/lib/auth';
import { OidcError } from '@/lib/oidc';

import { DEMO_ACCOUNTS } from '../utils/demo-accounts';

type KeycloakRedirectProps = {
  action: 'login' | 'register';
};

/**
 * Connexion et inscription : pages de Keycloak (thème Jàngu Bi). Ici, on ne
 * fait que préparer la demande (PKCE) et y envoyer le navigateur. En mode
 * mocks, le choix d'un compte de démonstration remplace la page Keycloak.
 */
export const KeycloakRedirect = ({ action }: KeycloakRedirectProps) => {
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo') ?? null;
  const [erreur, setErreur] = React.useState<string | null>(null);
  const lance = React.useRef(false);

  const partir = React.useCallback(
    async (loginHint?: string) => {
      setErreur(null);
      try {
        const start = action === 'register' ? startRegister : startLogin;
        await start({
          redirectTo: redirectTo ? decodeURIComponent(redirectTo) : null,
          loginHint,
        });
      } catch (e) {
        setErreur(
          e instanceof OidcError
            ? e.message
            : 'La page de connexion ne répond pas. Réessayez.',
        );
      }
    },
    [action, redirectTo],
  );

  React.useEffect(() => {
    if (env.ENABLE_API_MOCKING || lance.current) return;
    lance.current = true;
    void partir();
  }, [partir]);

  if (env.ENABLE_API_MOCKING) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Mode démonstration : choisissez un compte.
        </p>
        <ul className="space-y-2">
          {DEMO_ACCOUNTS.map((compte) => (
            <li key={compte.email}>
              <button
                type="button"
                onClick={() => void partir(compte.email)}
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="block text-sm font-medium text-foreground">
                  {compte.title} {compte.first_name} {compte.last_name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {compte.description}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {erreur && (
          <p role="alert" className="text-sm text-destructive">
            {erreur}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 text-center">
      {erreur ? (
        <p role="alert" className="text-sm text-destructive">
          {erreur}
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3" aria-live="polite">
          <Spinner />
          <p className="text-sm text-muted-foreground">
            {action === 'register'
              ? 'Ouverture de la page d’inscription…'
              : 'Ouverture de la page de connexion…'}
          </p>
        </div>
      )}
      <Button type="button" className="w-full" onClick={() => void partir()}>
        {action === 'register' ? 'Créer mon compte' : 'Se connecter'}
      </Button>
      <p className="text-sm text-muted-foreground">
        {action === 'register' ? (
          <>
            Déjà un compte ?{' '}
            <NextLink
              href={paths.auth.login.getHref(redirectTo)}
              className="font-medium text-primary hover:underline"
            >
              Se connecter
            </NextLink>
          </>
        ) : (
          <>
            Pas encore de compte ?{' '}
            <NextLink
              href={paths.auth.register.getHref(redirectTo)}
              className="font-medium text-primary hover:underline"
            >
              Créer un compte
            </NextLink>
          </>
        )}
      </p>
    </div>
  );
};
