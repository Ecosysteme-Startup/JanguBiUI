import type { JWT } from 'next-auth/jwt';

/** Marge avant expiration : on rafraîchit un peu avant, pour ne jamais envoyer un jeton mort. */
export const REFRESH_MARGIN_S = 30;

export const keycloakIssuer = () =>
  (process.env.AUTH_KEYCLOAK_ISSUER ?? 'http://localhost:8180/realms/jangubi').replace(/\/$/, '');

/** Adresse interne de Keycloak pour les appels serveur à serveur (Docker), sinon l'issuer public. */
export const keycloakInternal = () => (process.env.AUTH_KEYCLOAK_INTERNAL_ISSUER ?? keycloakIssuer()).replace(/\/$/, '');

export const keycloakClientId = () => process.env.AUTH_KEYCLOAK_ID ?? 'jangubi-web';

export const needsRefresh = (token: Pick<JWT, 'expiresAt'>, nowS = Math.floor(Date.now() / 1000)) =>
  typeof token.expiresAt === 'number' && nowS >= token.expiresAt - REFRESH_MARGIN_S;

type TokenResponse = { access_token: string; expires_in: number; refresh_token?: string; id_token?: string };

/**
 * Échange le refresh token (client public PKCE : pas de secret). En cas d'échec, le jeton est
 * marqué `RefreshTokenError` : l'interface renvoie alors vers la connexion.
 */
export const refreshAccessToken = async (token: JWT, fetchImpl: typeof fetch = fetch): Promise<JWT> => {
  if (!token.refreshToken) return { ...token, error: 'RefreshTokenError' };
  try {
    const response = await fetchImpl(`${keycloakInternal()}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: keycloakClientId(),
        refresh_token: token.refreshToken,
      }),
    });
    if (!response.ok) return { ...token, error: 'RefreshTokenError' };
    const data = (await response.json()) as TokenResponse;
    return {
      ...token,
      accessToken: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
      refreshToken: data.refresh_token ?? token.refreshToken,
      idToken: data.id_token ?? token.idToken,
      error: undefined,
    };
  } catch {
    return { ...token, error: 'RefreshTokenError' };
  }
};
