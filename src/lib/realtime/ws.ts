import { z } from 'zod';

import { api } from '@/lib/api-client';

// Authentification des WebSocket (backend `docs/TEMPS-REEL.md` §1) : ticket à
// usage unique, valable 60 s, demandé avec le jeton à chaque ouverture ou
// reconnexion. Le jeton d'accès ne passe jamais dans une URL.

/** `4401` : ticket invalide ou expiré ; `4001` : socket anonyme. */
export const WS_CODES_AUTH = new Set([4401, 4001]);
/** `4003` : pas participant de la conversation (inutile de réessayer). */
export const WS_CODE_INTERDIT = 4003;

/** Battement de présence (TEMPS-REEL §2.2). */
export const PRESENCE_PING_MS = 25_000;

export function resolveWsBase(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const u = new URL(apiUrl);
      const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProto}//${u.host}`;
    } catch {
      // repli ci-dessous
    }
  }
  return 'ws://localhost:8001';
}

const ticketSchema = z.object({
  ticket: z.string(),
  expires_in: z.number().optional(),
});

/** `POST /v1/me/ws-ticket/` → ticket à usage unique. */
export const getWsTicket = async (): Promise<string> => {
  const data = await api.post<unknown>('/v1/me/ws-ticket/');
  return ticketSchema.parse(data).ticket;
};

/** URL d'une socket authentifiée par ticket : `…/ws/<chemin>?ticket=…`. */
export const wsUrl = (chemin: string, ticket: string): string =>
  `${resolveWsBase()}/ws/${chemin.replace(/^\/|\/$/g, '')}/?ticket=${encodeURIComponent(ticket)}`;
