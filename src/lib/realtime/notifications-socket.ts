/**
 * Bus des trames `ws/notifications/` (docs/TEMPS-REEL.md du backend).
 *
 * La socket unique de l'onglet est ouverte par `useNotificationsSocket`
 * (monté dans le shell via `RealtimeBridge`) ; chaque trame reçue y est
 * publiée ici. Les modules qui ont besoin d'autres événements (le lecteur
 * pour `playback.state`) s'abonnent avec `subscribeNotifications(handler)`
 * au lieu d'ouvrir une seconde socket. Pour écrire sur cette socket ou la
 * relancer après l'état « hors ligne » : `sendNotificationsFrame`,
 * `retryNotificationsSocket`. Son état est dans `useRealtimeStore`.
 */

export type NotificationFrame = Record<string, unknown> & { type?: string };
type Handler = (frame: NotificationFrame) => void;

const handlers = new Set<Handler>();

export function publishNotificationFrame(frame: NotificationFrame) {
  handlers.forEach((h) => {
    try {
      h(frame);
    } catch {
      // un abonné en erreur ne coupe pas les autres
    }
  });
}

export function subscribeNotifications(handler: Handler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

/** Tests : injecte une trame comme si elle venait du serveur. */
export function dispatchNotificationFrameForTests(frame: NotificationFrame) {
  publishNotificationFrame(frame);
}

type SocketHandle = { send: (data: unknown) => boolean; retry: () => void };

let active: SocketHandle | null = null;

/** Réservé à `useNotificationsSocket` : déclare (ou retire, `null`) la socket de l'onglet. */
export function registerNotificationsSocket(handle: SocketHandle | null) {
  active = handle;
}

/** Envoie une trame sur la socket de l'onglet ; `false` si elle n'est pas ouverte. */
export function sendNotificationsFrame(data: unknown): boolean {
  return active?.send(data) ?? false;
}

/** Relance la socket de l'onglet après l'état « hors ligne ». */
export function retryNotificationsSocket() {
  active?.retry();
}
