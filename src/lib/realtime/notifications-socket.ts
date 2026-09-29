/**
 * Bus des trames `ws/notifications/` (docs/TEMPS-REEL.md du backend).
 *
 * La socket unique de l'onglet est ouverte par `useNotificationsSocket`
 * (monté dans le shell via `RealtimeBridge`) ; chaque trame reçue y est
 * publiée ici. Les modules qui ont besoin d'autres événements (le lecteur
 * pour `playback.state`) s'abonnent avec `subscribeNotifications(handler)`
 * au lieu d'ouvrir une seconde socket.
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
