import { useNotifications } from '@/components/ui/notifications';
import { env } from '@/config/env';

import {
  type OidcTokens,
  readSession,
  refreshTokens,
  sessionFromTokens,
  writeSession,
} from './oidc';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    /** Code d'erreur V1 (`{"error": {"code"}}`) : `mfa_required`, `not_found`… */
    public readonly code: string | null = null,
    public readonly details: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// --- Jetons Keycloak ----------------------------------------------------------
// Jeton d'accès : en mémoire seulement (10 min, rafraîchi avant échéance et sur
// 401). Jeton de rafraîchissement et id_token : sessionStorage de l'onglet
// (voir `oidc.ts`).

let _accessToken: string | null = null;
let _refreshTimer: ReturnType<typeof setTimeout> | null = null;

export function setAccessToken(token: string): void {
  _accessToken = token;
}

export function clearAccessToken(): void {
  _accessToken = null;
  if (_refreshTimer) clearTimeout(_refreshTimer);
  _refreshTimer = null;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

/** Vrai si l'onglet a une session Keycloak (jeton de rafraîchissement). */
export function getRefreshToken(): string | null {
  return readSession()?.refresh_token ?? null;
}

export function setRefreshToken(token: string): void {
  writeSession({ ...emptySession, ...readSession(), refresh_token: token });
}

export function clearRefreshToken(): void {
  writeSession(null);
}

const emptySession = {
  refresh_token: null,
  id_token: null,
  refresh_expires_at: null,
};

/** Enregistre les jetons reçus de Keycloak et planifie le rafraîchissement
 *  silencieux une minute avant l'échéance du jeton d'accès. */
export function setSessionTokens(tokens: OidcTokens): void {
  setAccessToken(tokens.access_token);
  writeSession(sessionFromTokens(tokens, readSession()));
  if (_refreshTimer) clearTimeout(_refreshTimer);
  _refreshTimer = null;
  if (typeof window !== 'undefined' && tokens.expires_in) {
    const delay = Math.max(5, tokens.expires_in - 60) * 1000;
    _refreshTimer = setTimeout(() => {
      _refreshTimer = null;
      tryRefreshAccess().catch(() => {
        // session terminée : le prochain appel renverra vers la connexion
      });
    }, delay);
  }
}

/** Oublie la session locale (jetons en mémoire et dans l'onglet). */
export function clearSession(): void {
  clearAccessToken();
  clearRefreshToken();
}

let _refreshPromise: Promise<void> | null = null;

/** Échange le jeton de rafraîchissement contre un nouveau jeton d'accès.
 *  Les appels simultanés partagent le même échange. Échec = session morte. */
export async function tryRefreshAccess(): Promise<void> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    try {
      const refresh = getRefreshToken();
      if (!refresh) throw new Error('No refresh token');
      try {
        setSessionTokens(await refreshTokens(refresh));
      } catch (e) {
        clearSession();
        throw e;
      }
    } finally {
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}

const redirectToLogin = (): boolean => {
  const { pathname, search } = window.location;
  const isPublicPage = pathname === '/' || pathname.startsWith('/auth/');
  if (isPublicPage) return false;
  const redirectTo = encodeURIComponent(`${pathname}${search}`);
  window.location.href = `/auth/login?redirectTo=${redirectTo}`;
  return true;
};

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  cookie?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  /** Pas de notification en cas d'erreur (l'appelant gère l'état). */
  quiet?: boolean;
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

/** Message et code d'une réponse en erreur : format V1
 *  `{"error": {"code", "message", "details"}}`, puis DRF `{"detail"}`. */
export async function readApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const v1 = body.error as
    | { code?: unknown; message?: unknown; details?: unknown }
    | undefined;
  const message =
    (typeof v1?.message === 'string' ? v1.message : undefined) ||
    (typeof body.detail === 'string' ? body.detail : undefined) ||
    (typeof body.message === 'string' ? body.message : undefined) ||
    response.statusText ||
    `Erreur ${response.status}`;
  const code =
    (typeof v1?.code === 'string' ? v1.code : undefined) ||
    (typeof body.code === 'string' ? body.code : undefined) ||
    null;
  return new ApiError(message, response.status, code, v1?.details ?? null);
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
    quiet = false,
  } = options;

  // Get cookies from the request when running on server
  let cookieHeader = cookie;
  if (typeof window === 'undefined' && !cookie) {
    cookieHeader = await getServerCookies();
  }

  const fullUrl = buildUrlWithParams(`${env.API_URL}${url}`, params);
  const send = () =>
    fetch(
      fullUrl,
      buildFetchInit(method, body, headers, cookieHeader, cache, next),
    );

  let response = await send();

  // 401 : jeton d'accès expiré (ou absent après un rechargement). On le
  // rafraîchit auprès de Keycloak puis on relance la requête une fois.
  if (response.status === 401 && typeof window !== 'undefined') {
    if (getRefreshToken()) {
      try {
        await tryRefreshAccess();
        response = await send();
      } catch {
        // session Keycloak terminée : traitée ci-dessous
      }
    }
    if (response.status === 401) {
      clearSession();
      if (redirectToLogin()) return new Promise<never>(() => {});
    }
  }

  if (!response.ok) {
    const error = await readApiError(response);
    if (
      typeof window !== 'undefined' &&
      !quiet &&
      response.status !== 404 &&
      response.status !== 401
    ) {
      useNotifications.getState().addNotification({
        type: 'error',
        title: 'Erreur',
        message: error.message,
      });
    }
    throw error;
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
