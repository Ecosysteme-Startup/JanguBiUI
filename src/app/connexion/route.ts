import { type NextRequest, NextResponse } from 'next/server';

import { paths } from '@/config/paths';
import { signIn } from '@/lib/auth';
import { safeRedirect } from '@/utils/safe-redirect';

/**
 * `/connexion` : envoie vers la page de connexion Keycloak (thème Jàngu Bi, PUB-Connexion).
 * `?reauth=1` force une nouvelle authentification (`prompt=login`) : un responsable qui vient
 * de recevoir le rôle staff y enrôle alors son code à usage unique (MFA exigée).
 *
 * Auth.js renvoie ici (`pages.signIn`) les erreurs de connexion de type « signIn »
 * (`?error=OAuthCallbackError`, par exemple quand la personne annule sur Keycloak). Relancer
 * aussitôt la connexion bouclerait : on affiche plutôt la page d'erreur, qui propose de recommencer.
 */
export const GET = async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const redirectTo = safeRedirect(params.get('redirectTo'));
  const error = params.get('error');
  if (error) {
    return NextResponse.redirect(new URL(paths.auth.erreur.getHref(error, redirectTo), request.nextUrl.origin));
  }
  const reauth = params.get('reauth') === '1';
  return signIn('keycloak', { redirectTo }, reauth ? { prompt: 'login' } : undefined);
};
