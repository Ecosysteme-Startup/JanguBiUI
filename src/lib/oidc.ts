import { env } from '@/config/env';

/**
 * Connexion OIDC à Keycloak (realm `jangubi`, client public `jangubi-web`) :
 * Authorization Code + PKCE S256, sans bibliothèque.
 *
 * - Le jeton d'accès (10 min) vit en mémoire seulement (voir `api-client.ts`).
 * - Le jeton de rafraîchissement et l'`id_token` (pour la déconnexion) vivent
 *   dans le `sessionStorage` de l'onglet : ils survivent à un rechargement mais
 *   pas à la fermeture de l'onglet. Un nouvel onglet repasse par Keycloak, qui
 *   reconnaît la session SSO (12 h) et renvoie aussitôt un code, sans saisie.
 * - Inscription : même flux avec `prompt=create` (page d'inscription Keycloak).
 * - Déconnexion : `end_session_endpoint` avec `id_token_hint`.
 *
 * En mode mocks (NEXT_PUBLIC_API_MOCKING=true, jamais en production), la
 * « page Keycloak » est remplacée par le choix d'un compte de démonstration :
 * le code renvoyé au rappel est `demo:<e-mail>` et l'échange du code passe par
 * le point de jeton simulé des handlers MSW. Le reste du parcours (rappel,
 * vérification de `state`, échange, rafraîchissement) est le même.
 */

export const OIDC_CALLBACK_PATH = '/auth/callback';

const TX_PREFIX = 'jb_oidc_tx:';
const SESSION_KEY = 'jb_oidc_session';
const TX_MAX_AGE_MS = 15 * 60_000;

export type OidcTokens = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_expires_in?: number;
  id_token?: string;
  token_type?: string;
  scope?: string;
};

export type OidcSession = {
  refresh_token: string | null;
  id_token: string | null;
  /** Échéance du jeton de rafraîchissement (ms epoch), si Keycloak la donne. */
  refresh_expires_at: number | null;
};

type Transaction = {
  verifier: string;
  nonce: string;
  redirectTo: string | null;
  createdAt: number;
};

export class OidcError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'oidc_error',
  ) {
    super(message);
    this.name = 'OidcError';
  }
}

// --- Configuration ------------------------------------------------------------

export const realmUrl = (): string =>
  `${env.KEYCLOAK_URL.replace(/\/+$/, '')}/realms/${encodeURIComponent(env.KEYCLOAK_REALM)}`;

export const oidcEndpoints = () => {
  const base = `${realmUrl()}/protocol/openid-connect`;
  return {
    authorization: `${base}/auth`,
    token: `${base}/token`,
    endSession: `${base}/logout`,
  };
};

/** Console de compte Keycloak : mot de passe, e-mail, double authentification. */
export const accountConsoleUrl = (
  section: 'security' | 'personal' = 'security',
) =>
  `${realmUrl()}/account/${section === 'security' ? '#/security/signingin' : ''}`;

const origin = (): string =>
  typeof window !== 'undefined' ? window.location.origin : env.APP_URL;

export const redirectUri = (): string => `${origin()}${OIDC_CALLBACK_PATH}`;

// --- Stockage (sessionStorage de l'onglet) ------------------------------------

const storage = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null; // navigation privée stricte : session en mémoire seulement
  }
};

let memorySession: OidcSession | null = null;

export function readSession(): OidcSession | null {
  if (memorySession) return memorySession;
  const raw = storage()?.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    memorySession = JSON.parse(raw) as OidcSession;
    return memorySession;
  } catch {
    return null;
  }
}

export function writeSession(session: OidcSession | null): void {
  memorySession = session;
  const s = storage();
  if (!s) return;
  try {
    if (session) s.setItem(SESSION_KEY, JSON.stringify(session));
    else s.removeItem(SESSION_KEY);
  } catch {
    // quota ou stockage refusé : la session reste en mémoire
  }
}

export function sessionFromTokens(
  tokens: OidcTokens,
  previous: OidcSession | null = null,
  now: number = Date.now(),
): OidcSession {
  return {
    // Keycloak renvoie un nouveau jeton de rafraîchissement à chaque échange ;
    // à défaut, on garde le précédent.
    refresh_token: tokens.refresh_token ?? previous?.refresh_token ?? null,
    id_token: tokens.id_token ?? previous?.id_token ?? null,
    refresh_expires_at: tokens.refresh_expires_in
      ? now + tokens.refresh_expires_in * 1000
      : (previous?.refresh_expires_at ?? null),
  };
}

// --- PKCE ---------------------------------------------------------------------

const base64url = (bytes: Uint8Array): string => {
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const randomString = (size = 32): string => {
  const bytes = new Uint8Array(size);
  globalThis.crypto.getRandomValues(bytes);
  return base64url(bytes);
};

export async function pkceChallenge(verifier: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    // crypto.subtle n'existe qu'en contexte sécurisé (https ou localhost).
    throw new OidcError(
      'La connexion exige une adresse sécurisée (https).',
      'insecure_context',
    );
  }
  const digest = await subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  );
  return base64url(new Uint8Array(digest));
}

/** Charge utile d'un JWT, sans vérification (lecture du `nonce`, de `exp`). */
export function decodeJwtPayload(
  token: string,
): Record<string, unknown> | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(json, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

/** Seules les destinations internes sont suivies après la connexion. */
export const safeRedirect = (
  value: string | null | undefined,
): string | null =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : null;

// --- Connexion ----------------------------------------------------------------

type BeginOptions = {
  redirectTo?: string | null;
  /** `register` : page d'inscription Keycloak (`prompt=create`). */
  action?: 'login' | 'register';
  /** Adresse pré-remplie ; en mode mocks, le compte de démonstration choisi. */
  loginHint?: string;
};

/** Prépare la transaction (state, nonce, vérificateur PKCE) et rend l'URL
 *  d'autorisation Keycloak où envoyer le navigateur. */
export async function buildAuthorizationUrl({
  redirectTo = null,
  action = 'login',
  loginHint,
}: BeginOptions = {}): Promise<string> {
  const state = randomString(16);
  const nonce = randomString(16);
  const verifier = randomString(48);
  const challenge = await pkceChallenge(verifier);
  const tx: Transaction = {
    verifier,
    nonce,
    redirectTo: safeRedirect(redirectTo),
    createdAt: Date.now(),
  };
  storage()?.setItem(`${TX_PREFIX}${state}`, JSON.stringify(tx));

  if (env.ENABLE_API_MOCKING) {
    const qs = new URLSearchParams({
      code: `demo:${loginHint ?? ''}`,
      state,
    });
    return `${OIDC_CALLBACK_PATH}?${qs.toString()}`;
  }

  const params = new URLSearchParams({
    client_id: env.KEYCLOAK_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: 'openid profile email',
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    ui_locales: 'fr',
  });
  if (action === 'register') params.set('prompt', 'create');
  if (loginHint) params.set('login_hint', loginHint);
  return `${oidcEndpoints().authorization}?${params.toString()}`;
}

const postToken = async (body: Record<string, string>): Promise<OidcTokens> => {
  let res: Response;
  try {
    res = await fetch(oidcEndpoints().token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.KEYCLOAK_CLIENT_ID,
        ...body,
      }).toString(),
    });
  } catch {
    throw new OidcError(
      'Le service de connexion est injoignable. Réessayez dans un instant.',
      'network_error',
    );
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof data.access_token !== 'string') {
    const code = typeof data.error === 'string' ? data.error : 'token_error';
    throw new OidcError('La session a expiré. Reconnectez-vous.', code);
  }
  return data as unknown as OidcTokens;
};

/** Rappel `/auth/callback?code&state` : vérifie la transaction, échange le
 *  code contre les jetons. Rend les jetons et la destination demandée. */
export async function exchangeCallback(
  search: URLSearchParams,
): Promise<{ tokens: OidcTokens; redirectTo: string | null }> {
  const error = search.get('error');
  if (error) {
    throw new OidcError(
      error === 'access_denied'
        ? 'La connexion a été annulée.'
        : 'La connexion n’a pas abouti. Réessayez.',
      error,
    );
  }
  const code = search.get('code');
  const state = search.get('state');
  if (!code || !state) {
    throw new OidcError('Retour de connexion incomplet.', 'invalid_callback');
  }
  const s = storage();
  const raw = s?.getItem(`${TX_PREFIX}${state}`);
  s?.removeItem(`${TX_PREFIX}${state}`);
  const tx = raw ? (JSON.parse(raw) as Transaction) : null;
  if (!tx || Date.now() - tx.createdAt > TX_MAX_AGE_MS) {
    throw new OidcError(
      'Cette demande de connexion a expiré. Recommencez.',
      'invalid_state',
    );
  }
  const tokens = await postToken({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    code_verifier: tx.verifier,
  });
  if (tokens.id_token && !env.ENABLE_API_MOCKING) {
    const claims = decodeJwtPayload(tokens.id_token);
    if (claims?.nonce !== tx.nonce) {
      throw new OidcError('Réponse de connexion invalide.', 'invalid_nonce');
    }
  }
  return { tokens, redirectTo: tx.redirectTo };
}

export const refreshTokens = (refreshToken: string): Promise<OidcTokens> =>
  postToken({ grant_type: 'refresh_token', refresh_token: refreshToken });

/** URL de fin de session Keycloak (retour sur l'accueil). */
export function buildEndSessionUrl(idToken: string | null): string {
  if (env.ENABLE_API_MOCKING) return '/';
  const params = new URLSearchParams({
    client_id: env.KEYCLOAK_CLIENT_ID,
    post_logout_redirect_uri: `${origin()}/`,
  });
  if (idToken) params.set('id_token_hint', idToken);
  return `${oidcEndpoints().endSession}?${params.toString()}`;
}
