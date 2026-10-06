import type { NextRequest } from 'next/server';

/**
 * Origine publique du site (schéma + hôte), telle que vue par le navigateur.
 *
 * Derrière un proxy (Traefik), `request.nextUrl.origin` renvoie l'origine interne du conteneur
 * (ex. `https://0.0.0.0:3000`), inutilisable pour une redirection renvoyée au client ou envoyée à
 * Keycloak (« URI de redirection invalide »). On privilégie donc, dans l'ordre :
 *   1. l'adresse publique configurée (`AUTH_URL` / `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL`) ;
 *   2. les en-têtes `x-forwarded-host` / `x-forwarded-proto` posés par le proxy ;
 *   3. en dernier recours l'origine de la requête (développement local sans proxy).
 */
export const publicOrigin = (request: NextRequest): string => {
  const configured = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // adresse mal formée : on retombe sur les en-têtes du proxy
    }
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  if (forwardedHost) {
    const host = forwardedHost.split(',')[0]!.trim();
    const proto = (request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https').replace(/:$/, '');
    return `${proto}://${host}`;
  }

  return request.nextUrl.origin;
};

/** Construit une URL absolue publique à partir d'un chemin (`/`, `/app`…). */
export const publicUrl = (request: NextRequest, path = '/'): string => new URL(path, `${publicOrigin(request)}/`).toString();
