import { z } from 'zod';

import { env } from '@/config/env';
import { api } from '@/lib/api-client';

export type SocketStatus = 'connecting' | 'open' | 'reconnecting' | 'offline' | 'forbidden' | 'closed';

const ticketSchema = z.object({ ticket: z.string(), expires_in: z.number() });

/** Ticket à usage unique (60 s) : le jeton d'accès ne passe jamais dans l'URL du WebSocket. */
export const getWsTicket = async () => ticketSchema.parse(await api.post('/me/ws-ticket/')).ticket;

export const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 15_000;
export const backoffDelay = (attempt: number) => Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt);

const CLOSE_FORBIDDEN = 4003;
const CLOSE_NORMAL = 1000;

type SocketOptions = {
  onMessage: (data: unknown) => void;
  onStatus?: (status: SocketStatus) => void;
  /** Injectables pour les tests. */
  WebSocketImpl?: typeof WebSocket;
  ticket?: () => Promise<string>;
  schedule?: (fn: () => void, ms: number) => unknown;
};

export type ManagedSocket = { send: (data: unknown) => boolean; retry: () => void; close: () => void };

/**
 * Socket géré (spec §3) : ticket frais à chaque connexion, reprise exponentielle plafonnée à
 * cinq tentatives, puis état « hors ligne » que l'interface propose de relancer (`retry`).
 * 4003 (accès refusé) ne se relance pas.
 */
export const createSocket = (path: string, options: SocketOptions): ManagedSocket => {
  const WS = options.WebSocketImpl ?? WebSocket;
  const ticket = options.ticket ?? getWsTicket;
  const schedule = options.schedule ?? ((fn, ms) => setTimeout(fn, ms));
  let socket: WebSocket | null = null;
  let attempts = 0;
  let stopped = false;
  const setStatus = (s: SocketStatus) => options.onStatus?.(s);

  const scheduleReconnect = () => {
    if (stopped) return;
    if (attempts >= MAX_ATTEMPTS) {
      setStatus('offline');
      return;
    }
    setStatus('reconnecting');
    schedule(connect, backoffDelay(attempts));
    attempts += 1;
  };

  async function connect() {
    if (stopped) return;
    setStatus(attempts === 0 ? 'connecting' : 'reconnecting');
    let value: string;
    try {
      value = await ticket();
    } catch {
      scheduleReconnect();
      return;
    }
    if (stopped) return;
    const url = `${env.WS_URL}${path}${path.includes('?') ? '&' : '?'}ticket=${encodeURIComponent(value)}`;
    socket = new WS(url);
    socket.onopen = () => {
      attempts = 0;
      setStatus('open');
    };
    socket.onmessage = (event: MessageEvent) => {
      try {
        options.onMessage(JSON.parse(String(event.data)));
      } catch {
        // Trame illisible : ignorée, jamais journalisée (contenu potentiellement sensible).
      }
    };
    socket.onclose = (event: CloseEvent) => {
      socket = null;
      if (stopped || event.code === CLOSE_NORMAL) {
        setStatus('closed');
        return;
      }
      if (event.code === CLOSE_FORBIDDEN) {
        setStatus('forbidden');
        return;
      }
      scheduleReconnect();
    };
  }

  void connect();

  return {
    send: (data) => {
      if (!socket || socket.readyState !== WS.OPEN) return false;
      socket.send(JSON.stringify(data));
      return true;
    },
    retry: () => {
      if (stopped || socket) return;
      attempts = 0;
      void connect();
    },
    close: () => {
      stopped = true;
      socket?.close(CLOSE_NORMAL);
      socket = null;
      setStatus('closed');
    },
  };
};
