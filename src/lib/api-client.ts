import { useNotifications } from '@/components/ui/notifications';
import { env } from '@/config/env';

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

export function setAccessToken(token: string): void {
  _accessToken = token;
}

export function clearAccessToken(): void {
  _accessToken = null;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// Refresh token — persisted to localStorage so it survives page reloads
const REFRESH_TOKEN_KEY = 'jb_refresh_token';

let _refreshToken: string | null = (() => {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
  } catch {
    return null;
  }
})();

export function setRefreshToken(token: string): void {
  _refreshToken = token;
  try {
    if (typeof window !== 'undefined') localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    // localStorage indisponible (SSR / navigation privée) — non bloquant
  }
}

export function clearRefreshToken(): void {
  _refreshToken = null;
  try {
    if (typeof window !== 'undefined') localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // localStorage indisponible (SSR / navigation privée) — non bloquant
  }
}

export function getRefreshToken(): string | null {
  return _refreshToken;
}

let _isRefreshing = false;
let _refreshPromise: Promise<void> | null = null;

export async function tryRefreshAccess(): Promise<void> {
  if (_isRefreshing) return _refreshPromise!;

  _isRefreshing = true;
  _refreshPromise = (async () => {
    try {
      if (!_refreshToken) throw new Error('No refresh token');
      const res = await fetch(`${env.API_URL}/v1/auth/jwt/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refresh: _refreshToken }),
      });
      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      if (data.access) setAccessToken(data.access);
      if (data.refresh) setRefreshToken(data.refresh);
    } finally {
      _isRefreshing = false;
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
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

  // Get cookies from the request when running on server
  let cookieHeader = cookie;
  if (typeof window === 'undefined' && !cookie) {
    cookieHeader = await getServerCookies();
  }

  const fullUrl = buildUrlWithParams(`${env.API_URL}${url}`, params);
  const init = buildFetchInit(method, body, headers, cookieHeader, cache, next);

  const response = await fetch(fullUrl, init);

  // A 401 on the login/refresh endpoints means "bad credentials" or "dead
  // session" — NOT an expired access token. Attempting a refresh here swallows
  // the error before the user sees it (silent login failure). Let these fall
  // through to the generic error handler below so a toast is shown.
  const isAuthCredentialEndpoint =
    url.includes('/auth/jwt/login/') || url.includes('/auth/jwt/refresh/');

  if (
    response.status === 401 &&
    typeof window !== 'undefined' &&
    !isAuthCredentialEndpoint
  ) {
    try {
      await tryRefreshAccess();
    } catch {
      // Refresh token expired or missing — session is dead, redirect to login
      clearAccessToken();
      clearRefreshToken();
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
      headers,
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
    // DRF renvoie l'erreur sous `detail` ({"detail": "..."}). On lit `detail`
    // en priorité, puis `message` (autres backends), puis le statut HTTP.
    // Format V1 : {"error": {"code", "message", "details"}}.
    const v1Error = body.error as { message?: unknown } | undefined;
    let message =
      (body.detail as string | undefined) ||
      (body.message as string | undefined) ||
      (typeof v1Error?.message === 'string' ? v1Error.message : undefined) ||
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
