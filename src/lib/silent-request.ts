import { env } from '@/config/env';
import { currentAccessToken, renewAccessToken } from '@/lib/api-client';

/**
 * Requête « de fond » : pas de toast en cas d'échec (contrairement à `api`),
 * rafraîchissement du jeton sur 401, `keepalive` possible (pagehide).
 * Pour les synchronisations périodiques et les sockets, jamais pour une
 * action de la personne.
 */

export class SilentHttpError extends Error {
  constructor(
    public readonly status: number,
    /** En-tête `Retry-After` en secondes (429, 503), si le serveur le donne. */
    public readonly retryAfter: number | null = null,
  ) {
    super(`HTTP ${status}`);
  }
}

/** `Retry-After` : un nombre de secondes ou une date HTTP. */
export function parseRetryAfter(
  value: string | null,
  now: number = Date.now(),
): number | null {
  if (!value) return null;
  const n = Number(value.trim());
  if (Number.isFinite(n)) return Math.max(0, n);
  const date = Date.parse(value);
  if (Number.isNaN(date)) return null;
  return Math.max(0, Math.ceil((date - now) / 1000));
}

interface SilentOptions {
  method?: string;
  body?: unknown;
  /** `fetch(…, {keepalive})` : survit à la fermeture de l'onglet (pagehide). */
  keepalive?: boolean;
}

function headers(token: string | null): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function silent<T = unknown>(
  path: string,
  { method = 'GET', body, keepalive = false }: SilentOptions = {},
): Promise<{ status: number; data: T | null }> {
  let token = await currentAccessToken();
  const init = (): RequestInit => ({
    method,
    headers: headers(token),
    body: body === undefined ? undefined : JSON.stringify(body),
    keepalive,
  });
  let res = await fetch(`${env.API_URL}${path}`, init());
  if (res.status === 401 && !keepalive) {
    token = await renewAccessToken().catch(() => null);
    if (!token) throw new SilentHttpError(401);
    res = await fetch(`${env.API_URL}${path}`, init());
  }
  if (!res.ok)
    throw new SilentHttpError(
      res.status,
      parseRetryAfter(res.headers.get('Retry-After')),
    );
  if (res.status === 204) return { status: 204, data: null };
  const text = await res.text();
  return { status: res.status, data: text ? (JSON.parse(text) as T) : null };
}
