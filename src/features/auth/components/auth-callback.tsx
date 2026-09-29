'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { setSessionTokens } from '@/lib/api-client';
import { getUserQueryOptions, startLogin } from '@/lib/auth';
import { getRoleHomePath } from '@/lib/get-role-home-path';
import { exchangeCallback, OidcError } from '@/lib/oidc';

/**
 * Rappel OIDC (`/auth/callback?code&state`) : échange du code contre les
 * jetons (PKCE), lecture de la personne (/v1/me/, qui la provisionne côté API
 * à la première connexion), puis retour à la page demandée.
 */
export const AuthCallback = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [erreur, setErreur] = React.useState<string | null>(null);
  const fait = React.useRef(false);

  React.useEffect(() => {
    if (fait.current) return;
    fait.current = true;
    const search = new URLSearchParams(window.location.search);
    (async () => {
      try {
        const { tokens, redirectTo } = await exchangeCallback(search);
        setSessionTokens(tokens);
        const user = await queryClient.fetchQuery({
          ...getUserQueryOptions(),
          staleTime: 0,
        });
        router.replace(redirectTo ?? getRoleHomePath(user));
      } catch (e) {
        setErreur(
          e instanceof OidcError
            ? e.message
            : 'Votre compte n’a pas pu être ouvert. Réessayez dans un instant.',
        );
      }
    })();
  }, [queryClient, router]);

  if (erreur) {
    return (
      <div className="space-y-4 text-center">
        <p role="alert" className="text-sm text-destructive">
          {erreur}
        </p>
        <Button
          type="button"
          className="w-full"
          onClick={() => void startLogin()}
        >
          Se connecter
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-3 text-center"
      aria-live="polite"
    >
      <Spinner />
      <p className="text-sm text-muted-foreground">Connexion en cours…</p>
    </div>
  );
};
