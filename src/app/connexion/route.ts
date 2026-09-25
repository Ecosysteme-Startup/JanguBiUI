import type { NextRequest } from 'next/server';

import { signIn } from '@/lib/auth';
import { safeRedirect } from '@/utils/safe-redirect';

/** `/connexion` : envoie vers la page de connexion Keycloak (thème Jàngu Bi, PUB-Connexion). */
export const GET = async (request: NextRequest) => {
  const redirectTo = safeRedirect(request.nextUrl.searchParams.get('redirectTo'));
  return signIn('keycloak', { redirectTo });
};
