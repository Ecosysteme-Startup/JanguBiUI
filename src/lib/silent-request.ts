import { env } from '@/config/env';
import { getAccessToken, tryRefreshAccess } from '@/lib/api-client';

/**
 * Requête « de fond » : pas de toast en cas d'échec (contrairement à `api`),
 * rafraîchissement du jeton sur 401, `keepalive` possible (pagehide).
 * Pour les synchronisations périodiques et les sockets, jamais pour une
 * action de la personne.
 */

export class SilentHttpError extends Error {
  constructor(public readonly status: number) {
    super(`HTTP ${status}`);
  }
}

interface SilentOptions {
  method?: string;
  body?: unknown;
  /** `fetch(…, {keepalive})` : survit à la fermeture de l'onglet (pagehide). */
  keepalive?: boolean;
}

function headers(): Record<string, string> {
  const token = getAccessToken();
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
  const init = (): RequestInit => ({
    method,
    headers: headers(),
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
    keepalive,
  });
  let res = await fetch(`${env.API_URL}${path}`, init());
  if (res.status === 401 && !keepalive) {
    try {
      await tryRefreshAccess();
      res = await fetch(`${env.API_URL}${path}`, init());
    } catch {
      throw new SilentHttpError(401);
    }
  }
  if (!res.ok) throw new SilentHttpError(res.status);
  if (res.status === 204) return { status: 204, data: null };
  const text = await res.text();
  return { status: res.status, data: text ? (JSON.parse(text) as T) : null };
}
