import { env } from '@/config/env';

/** Erreur HTTP de l'API : le message est sûr à afficher (aucun détail interne). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type AccessTokenProvider = () => Promise<string | null>;
/** Rafraîchit la session après un 401 ; renvoie le nouveau jeton (ou `null`) pour rejouer la requête. */
type UnauthorizedHandler = () => Promise<string | null> | void;

// Branchés par la couche d'authentification (F3) : aucun jeton n'est stocké ici.
let accessToken: AccessTokenProvider = async () => null;
let onUnauthorized: UnauthorizedHandler = () => undefined;

export const configureApiAuth = (options: { accessToken: AccessTokenProvider; onUnauthorized: UnauthorizedHandler }) => {
  accessToken = options.accessToken;
  onUnauthorized = options.onUnauthorized;
};

type Params = Record<string, string | number | boolean | null | undefined>;
type RequestOptions = { params?: Params; signal?: AbortSignal; body?: unknown };

const GENERIC_ERROR = 'Le service ne répond pas. Réessayez dans un instant.';

const buildUrl = (path: string, params?: Params) => {
  const url = new URL(`${env.API_URL}${path.startsWith('/') ? path : `/${path}`}`);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  return url.toString();
};

/**
 * Formats d'erreur de l'API : enveloppe V1 `{error: {code, message}}` (SRS §7), ancien `{detail}`
 * ou `{message}`, ou dictionnaire de champs DRF. On garde un message lisible et sûr.
 */
/** 429 : DRF répond en anglais (« Expected available in 879 seconds ») ; on reformule en français. */
const throttledMessage = (body: unknown): string => {
  const seconds = Number(/available in (\d+) second/i.exec(JSON.stringify(body ?? ''))?.[1]);
  if (!seconds) return 'Trop de tentatives. Réessayez un peu plus tard.';
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`;
};

export const errorMessageOf = (body: unknown, status: number): string => {
  // Seul le message anglais par défaut de DRF est reformulé ; un message métier en français est gardé.
  if (status === 429 && (!body || /request was throttled/i.test(JSON.stringify(body)))) return throttledMessage(body);
  if (body && typeof body === 'object') {
    const outer = body as Record<string, unknown>;
    const record = outer.error && typeof outer.error === 'object' ? (outer.error as Record<string, unknown>) : outer;
    for (const key of ['message', 'detail']) {
      if (typeof record[key] === 'string') return record[key] as string;
    }
  }
  if (status === 403) return 'Vous n’avez pas accès à cette action.';
  if (status === 404) return 'Élément introuvable.';
  return GENERIC_ERROR;
};

async function request<T>(method: string, path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const { params, signal, body } = options;
  const token = await accessToken();
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError(0, 'Pas de connexion. Vérifiez votre réseau puis réessayez.');
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!response.ok) {
    if (response.status === 401) {
      // Jeton expiré ou pas encore propagé : on rafraîchit la session et on rejoue UNE fois.
      const fresh = await onUnauthorized();
      if (token && fresh && !retried) return request<T>(method, path, options, true);
    }
    throw new ApiError(response.status, errorMessageOf(data, response.status), data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
};

/** Réponse paginée DRF (LimitOffsetPagination). */
export type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };
