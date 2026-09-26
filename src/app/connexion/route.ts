import type { NextRequest } from 'next/server';

import { signIn } from '@/lib/auth';
import { safeRedirect } from '@/utils/safe-redirect';

/**
 * `/connexion` : envoie vers la page de connexion Keycloak (thème Jàngu Bi, PUB-Connexion).
 * `?reauth=1` force une nouvelle authentification (`prompt=login`) : un responsable qui vient
 * de recevoir le rôle staff y enrôle alors son code à usage unique (MFA exigée).
 */
export const GET = async (request: NextRequest) => {
  const redirectTo = safeRedirect(request.nextUrl.searchParams.get('redirectTo'));
  const reauth = request.nextUrl.searchParams.get('reauth') === '1';
  return signIn('keycloak', { redirectTo }, reauth ? { prompt: 'login' } : undefined);
};
