import { silent } from '@/lib/silent-request';

/**
 * Socket unique `ws/notifications/` par onglet (docs/TEMPS-REEL.md du
 * backend) : ticket à usage unique (`POST /v1/me/ws-ticket/`) à chaque
 * ouverture, battement `presence.ping` toutes les 25 s, reconnexion avec
 * délai croissant. Partagé : chaque module s'abonne avec
 * `subscribeNotifications(handler)` ; la socket se ferme au dernier départ.
 *
 * Utilisé aujourd'hui par le lecteur (`playback.state`). La présence et les
 * notifications de l'app peuvent s'y abonner plutôt que d'ouvrir une autre
 * socket.
 */

export type NotificationFrame = Record<string, unknown> & { type?: string };
type Handler = (frame: NotificationFrame) => void;

const PING_MS = 25_000;
const RECONNECT_DELAYS = [1_000, 3_000, 10_000, 30_000];

const handlers = new Set<Handler>();
let socket: WebSocket | null = null;
let pingTimer: ReturnType<typeof setInterval> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let attempt = 0;
let opening = false;

function wsBase(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const u = new URL(apiUrl);
      return `${u.protocol === 'https:' ? 'wss:' : 'ws:'}//${u.host}`;
    } catch {
      // défaut ci-dessous
    }
  }
  return 'ws://localhost:8001';
}

function stopTimers() {
  if (pingTimer) clearInterval(pingTimer);
  if (retryTimer) clearTimeout(retryTimer);
  pingTimer = null;
  retryTimer = null;
}

function scheduleReconnect() {
  if (handlers.size === 0 || retryTimer) return;
  const delay =
    RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)];
  attempt++;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void open();
  }, delay);
}

async function open() {
  if (socket || opening || handlers.size === 0) return;
  if (typeof WebSocket === 'undefined') return;
  opening = true;
  let ticket: string | null = null;
  try {
    const { data } = await silent<{ ticket?: string }>('/v1/me/ws-ticket/', {
      method: 'POST',
    });
    ticket = data?.ticket ?? null;
  } catch {
    ticket = null;
  } finally {
    opening = false;
  }
  if (handlers.size === 0) return;
  if (!ticket) {
    scheduleReconnect();
    return;
  }
  let ws: WebSocket;
  try {
    ws = new WebSocket(
      `${wsBase()}/ws/notifications/?ticket=${encodeURIComponent(ticket)}`,
    );
  } catch {
    scheduleReconnect();
    return;
  }
  socket = ws;
  ws.onopen = () => {
    attempt = 0;
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = setInterval(() => {
      try {
        ws.send(JSON.stringify({ type: 'presence.ping' }));
      } catch {
        // la fermeture déclenchera la reconnexion
      }
    }, PING_MS);
  };
  ws.onmessage = (event: MessageEvent) => {
    let frame: NotificationFrame;
    try {
      frame = JSON.parse(String(event.data)) as NotificationFrame;
    } catch {
      return;
    }
    handlers.forEach((h) => {
      try {
        h(frame);
      } catch {
        // un abonné en erreur ne coupe pas les autres
      }
    });
  };
  ws.onclose = () => {
    if (socket === ws) socket = null;
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = null;
    // 4401 : ticket expiré → un nouveau ticket est demandé à la reconnexion.
    scheduleReconnect();
  };
}

export function subscribeNotifications(handler: Handler): () => void {
  handlers.add(handler);
  void open();
  return () => {
    handlers.delete(handler);
    if (handlers.size === 0) {
      stopTimers();
      const ws = socket;
      socket = null;
      attempt = 0;
      try {
        ws?.close(1000);
      } catch {
        // ignoré
      }
    }
  };
}

/** Tests : injecte une trame comme si elle venait du serveur. */
export function dispatchNotificationFrameForTests(frame: NotificationFrame) {
  handlers.forEach((h) => h(frame));
}
