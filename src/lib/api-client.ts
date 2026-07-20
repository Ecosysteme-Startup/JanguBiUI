import { useNotifications } from '@/components/ui/notifications';
import { env } from '@/config/env';
import { flattenApiError } from '@/utils/flatten-api-error';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Access token — memory only (short-lived, refreshed via /jwt/refresh/)
let _accessToken: string | null = null;

/** Décode la claim `exp` d'un JWT en millisecondes epoch — null si illisible. */
export function decodeJwtExpMs(token: string): number | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const claims = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
    ) as { exp?: number };
    return typeof claims.exp === 'number' ? claims.exp * 1000 : null;
  } catch {
    return null;
  }
}

// Refresh PROACTIF : reprogramme un refresh ~60 s avant l'expiration de
// l'access token pour que les pollers (notifications, conversations) ne
// rencontrent plus le 401 « attendu » à chaque fenêtre d'expiration.
let _refreshTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleProactiveRefresh(token: string): void {
  if (typeof window === 'undefined') return;
  if (_refreshTimer) clearTimeout(_refreshTimer);
  const expMs = decodeJwtExpMs(token);
  if (!expMs) return;
  const delay = Math.max(expMs - Date.now() - 60_000, 10_000);
  _refreshTimer = setTimeout(() => {
    tryRefreshAccess().catch(() => {
      // Échec silencieux : le refresh réactif sur 401 et le redirect login
      // existants prennent le relais.
    });
  }, delay);
}

export function setAccessToken(token: string): void {
  _accessToken = token;
  _sessionState = 'active';
  scheduleProactiveRefresh(token);
}

export function clearAccessToken(): void {
  _accessToken = null;
  if (_refreshTimer) {
    clearTimeout(_refreshTimer);
    _refreshTimer = null;
  }
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// -----------------------------------------------------------------------------
// Refresh token — cookie HttpOnly, JAMAIS accessible depuis ce fichier
// -----------------------------------------------------------------------------
// Le refresh token vit 7 jours. Tant qu'il était persisté dans localStorage, tout
// script exécuté sur la page pouvait le lire : une seule faille XSS donnait une
// prise de compte d'une semaine, bien au-delà de la session en cours. Il est
// désormais porté par un cookie `HttpOnly` posé par l'API — invisible pour
// JavaScript, y compris pour ce module.
//
// Le serveur ne bascule dans ce mode que si on le lui demande, via l'en-tête
// ci-dessous : sans lui, il continue de renvoyer le jeton dans le corps, ce dont
// le futur client React Native a besoin (un client natif ne gère pas les cookies
// comme un navigateur). Cf. JanguBi/apps/authentication/cookies.py.
export const AUTH_TRANSPORT_HEADER = 'X-Auth-Transport';
export const AUTH_TRANSPORT_COOKIE = 'cookie';

// Le cookie est restreint à `/api/v1/auth/jwt/` côté serveur : seuls ces
// endpoints le reçoivent, et seuls eux ont besoin de l'en-tête de transport.
// L'ajouter partout déclencherait un preflight CORS inutile sur chaque appel.
function isJwtAuthEndpoint(url: string): boolean {
  return url.includes('/v1/auth/jwt/');
}

/**
 * État de session connu du client.
 *
 * Le cookie de refresh étant illisible, on ne peut plus tester sa présence.
 * On raisonne donc par présomption : `unknown` tant que le serveur ne s'est pas
 * prononcé, `anonymous` uniquement après un refresh explicitement rejeté ou une
 * déconnexion. Cela évite de conclure « déconnecté » à tort au premier rendu.
 */
export type SessionState = 'unknown' | 'active' | 'anonymous';

let _sessionState: SessionState = 'unknown';

export function getSessionState(): SessionState {
  return _sessionState;
}

/** `false` seulement quand on SAIT qu'il n'y a plus de session exploitable. */
export function hasPotentialSession(): boolean {
  return _sessionState !== 'anonymous';
}

/**
 * Efface l'état d'authentification côté client.
 *
 * Remplace l'ancien couple `clearAccessToken()` + `clearRefreshToken()` : le
 * cookie de refresh ne peut être effacé que par le serveur (endpoint logout).
 * Dans les chemins « session déjà morte » (refresh rejeté), il n'y a rien à
 * révoquer — le jeton est déjà invalide — donc on se contente d'oublier l'état
 * local ; le cookie périmé sera écrasé à la prochaine connexion.
 */
export function clearSession(): void {
  clearAccessToken();
  _sessionState = 'anonymous';
}

let _isRefreshing = false;
let _refreshPromise: Promise<void> | null = null;

export async function tryRefreshAccess(): Promise<void> {
  if (_isRefreshing) return _refreshPromise!;

  _isRefreshing = true;
  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${env.API_URL}/v1/auth/jwt/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AUTH_TRANSPORT_HEADER]: AUTH_TRANSPORT_COOKIE,
        },
        // Sans `include`, le navigateur n'envoie pas le cookie de refresh
        // cross-origin : le renouvellement échouerait systématiquement.
        credentials: 'include',
        body: '{}',
      });
      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      // Une réponse 200 SANS access token doit être traitée comme un échec :
      // l'avaler laissait le client boucler en 401 silencieux avec un token
      // mort, sans jamais déclencher le redirect login.
      if (!data.access) {
        throw new Error('Réponse de refresh invalide : access token absent');
      }
      // Le refresh token pivoté est reposé dans le cookie par le serveur —
      // rien à stocker ici, c'est tout l'intérêt.
      setAccessToken(data.access);
    } catch (err) {
      // Le serveur a tranché : plus de session exploitable.
      _sessionState = 'anonymous';
      throw err;
    } finally {
      _isRefreshing = false;
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// --- Bootstrap de session (client uniquement) --------------------------------
// L'access token ne vit qu'en mémoire : à chaque cold load il est absent alors
// que le cookie de refresh, lui, a survécu. Sans ce bootstrap, la première
// requête (/me/, pollers) partirait sans Authorization → 401 garanti.
//
// Il ne peut plus être conditionné à la présence d'un jeton en localStorage
// (on ne peut plus la constater) : on tente donc systématiquement, et c'est la
// réponse du serveur qui tranche. Déclenché paresseusement, au premier appel
// d'API réel — pas au chargement du bundle — pour qu'un simple visiteur d'une
// page publique ne provoque aucune requête.
let _bootstrapPromise: Promise<void> | null = null;
let _bootstrapDone = false;

function ensureSessionBootstrap(): Promise<void> | null {
  if (typeof window === 'undefined' || _bootstrapDone) return null;
  if (!_bootstrapPromise) {
    _bootstrapPromise = tryRefreshAccess()
      .catch(() => {
        // Session morte — les requêtes suivantes déclencheront le redirect login.
      })
      .finally(() => {
        _bootstrapDone = true;
        _bootstrapPromise = null;
      });
  }
  return _bootstrapPromise;
}

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  cookie?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
};

function buildUrlWithParams(
  url: string,
  params?: RequestOptions['params'],
): string {
  if (!params) return url;
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null,
    ),
  );
  if (Object.keys(filteredParams).length === 0) return url;
  const queryString = new URLSearchParams(
    filteredParams as Record<string, string>,
  ).toString();
  return `${url}?${queryString}`;
}

// Create a separate function for getting server-side cookies that can be imported where needed
export function getServerCookies() {
  if (typeof window !== 'undefined') return '';

  // Dynamic import next/headers only on server-side
  return import('next/headers').then(async ({ cookies }) => {
    try {
      const cookieStore = await cookies();
      return cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join('; ');
    } catch {
      return '';
    }
  });
}

/**
 * Build the fetch init object for a request.
 * When body is FormData the browser must set the Content-Type with the
 * multipart boundary itself — we must NOT set it manually.
 */
function buildFetchInit(
  method: string,
  body: unknown,
  extraHeaders: Record<string, string>,
  cookieHeader: string | undefined,
  cache: RequestCache,
  next: NextFetchRequestConfig | undefined,
): RequestInit {
  const isFormData = body instanceof FormData;

  const contentHeaders: Record<string, string> = isFormData
    ? {}
    : { 'Content-Type': 'application/json' };

  const authHeader: Record<string, string> = _accessToken
    ? { Authorization: `Bearer ${_accessToken}` }
    : {};

  return {
    method,
    headers: {
      ...contentHeaders,
      Accept: 'application/json',
      ...authHeader,
      ...extraHeaders,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    credentials: 'include',
    cache,
    next,
  };
}

async function fetchApi<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    cookie,
    params,
    cache = 'no-store',
    next,
  } = options;

  // A 401 on the login/refresh endpoints means "bad credentials" or "dead
  // session" — NOT an expired access token. Attempting a refresh here swallows
  // the error before the user sees it (silent login failure). Let these fall
  // through to the generic error handler below so a toast is shown.
  const isAuthCredentialEndpoint =
    url.includes('/auth/jwt/login/') || url.includes('/auth/jwt/refresh/');

  // Cold load : sans access token en mémoire, tenter de relever la session
  // depuis le cookie AVANT d'émettre la requête. Jamais devant un login ou un
  // refresh : on n'a pas besoin d'une session pour aller en ouvrir une.
  if (
    typeof window !== 'undefined' &&
    !_accessToken &&
    !isAuthCredentialEndpoint
  ) {
    await ensureSessionBootstrap();
  }

  // Get cookies from the request when running on server
  let cookieHeader = cookie;
  if (typeof window === 'undefined' && !cookie) {
    cookieHeader = await getServerCookies();
  }

  // Réclame le transport par cookie sur les endpoints JWT : le serveur pose
  // alors le refresh token en cookie HttpOnly et l'omet du corps de réponse.
  const effectiveHeaders: Record<string, string> =
    typeof window !== 'undefined' && isJwtAuthEndpoint(url)
      ? { [AUTH_TRANSPORT_HEADER]: AUTH_TRANSPORT_COOKIE, ...headers }
      : headers;

  const fullUrl = buildUrlWithParams(`${env.API_URL}${url}`, params);
  const init = buildFetchInit(
    method,
    body,
    effectiveHeaders,
    cookieHeader,
    cache,
    next,
  );

  const response = await fetch(fullUrl, init);

  if (
    response.status === 401 &&
    typeof window !== 'undefined' &&
    !isAuthCredentialEndpoint
  ) {
    try {
      await tryRefreshAccess();
    } catch {
      // Refresh cookie expired or missing — session is dead, redirect to login.
      // Rien à révoquer côté serveur : le jeton vient d'être rejeté.
      clearSession();
      const { pathname } = window.location;
      const isPublicPage = pathname === '/' || pathname.startsWith('/auth/');
      if (!isPublicPage) {
        const redirectTo = encodeURIComponent(pathname);
        window.location.href = `/auth/login?redirectTo=${redirectTo}`;
        return new Promise<never>(() => {});
      }
      throw new Error('Unauthenticated');
    }

    // Refresh succeeded — retry with the new access token
    const retriedInit = buildFetchInit(
      method,
      body,
      effectiveHeaders,
      cookieHeader,
      cache,
      next,
    );
    const retried = await fetch(fullUrl, retriedInit);
    if (retried.ok) return retried.json() as Promise<T>;

    // Retry failed after a successful refresh (permission issue, not auth)
    const retryBody = (await retried.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const retryMessage =
      (retryBody.message as string | undefined) || retried.statusText;
    if (retried.status !== 401) {
      useNotifications.getState().addNotification({
        type: 'error',
        title: 'Erreur',
        message: retryMessage,
      });
    }
    throw new Error(retryMessage);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    // DRF renvoie l'erreur sous `detail`, qui vaut soit une chaîne, soit un
    // OBJET d'erreurs par champ ({"detail": {"phone_number": ["…"]}}). Le
    // transtypage `as string` d'origine mentait : l'objet finissait rendu comme
    // enfant React et faisait sauter l'écran entier. `flattenApiError` en tire
    // toujours une chaîne.
    let message =
      flattenApiError(body.detail) ||
      flattenApiError(body.message) ||
      response.statusText;
    // Message clair et en français pour un échec d'authentification au login
    // (SimpleJWT renvoie un message anglais peu parlant pour le fidèle).
    if (response.status === 401 && url.includes('/auth/jwt/login/')) {
      message = 'E-mail ou mot de passe incorrect.';
    }
    if (typeof window !== 'undefined' && response.status !== 404) {
      useNotifications.getState().addNotification({
        type: 'error',
        title: 'Erreur',
        message,
      });
    }
    throw new ApiError(message, response.status);
  }

  // 204 No Content (ex. DELETE) ou corps vide → pas de JSON à parser
  // (response.json() lèverait « Unexpected end of JSON input »).
  if (
    response.status === 204 ||
    response.headers.get('content-length') === '0'
  ) {
    return null as T;
  }

  return response.json();
}

export const api = {
  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'GET' });
  },
  post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'POST', body });
  },
  put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'PUT', body });
  },
  patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'PATCH', body });
  },
  delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'DELETE' });
  },
};
