import { type NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

import { signOut } from '@/lib/auth';
import { keycloakClientId, keycloakIssuer } from '@/lib/keycloak-token';

/**
 * Déconnexion globale (POST) : supprime la session Auth.js, puis renvoie l'adresse de fin de
 * session Keycloak que le client ouvre lui-même. Une redirection HTTP serait bloquée par la CSP
 * `form-action 'self'` (Keycloak est une autre origine).
 */
export const POST = async (request: NextRequest) => {
  const secureCookie = request.nextUrl.protocol === 'https:';
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET, secureCookie });
  await signOut({ redirect: false });

  const home = new URL('/', request.nextUrl.origin).toString();
  const logout = new URL(`${keycloakIssuer()}/protocol/openid-connect/logout`);
  logout.searchParams.set('post_logout_redirect_uri', home);
  logout.searchParams.set('client_id', keycloakClientId());
  if (token?.idToken) logout.searchParams.set('id_token_hint', token.idToken);
  return NextResponse.json({ redirectTo: logout.toString() });
};
