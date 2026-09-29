import { postListenEvents } from './api';
import { getDeviceId, newEventId } from './device';
import type { ListenEvent, ListenEventKind } from './types';

/**
 * File des événements d'écoute (`POST /audio/evenements/`, contrat §6).
 * - envoi en lot (100 au plus) toutes les 30 s, et à `pagehide` en keepalive ;
 * - la file est gardée dans le stockage local : une écoute hors ligne part à
 *   la reconnexion (le serveur accepte jusqu'à 7 jours) ;
 * - un lot en échec est renvoyé à l'identique (idempotence par
 *   `client_event_id` + `occurred_at`).
 */

const KEY = 'jb_player_events';
const MAX_BATCH = 100;
const MAX_AGE_MS = 7 * 24 * 3600 * 1000;
const MAX_QUEUE = 500;

let queue: ListenEvent[] | null = null;
let inFlight: Promise<void> | null = null;

function load(): ListenEvent[] {
  if (queue) return queue;
  try {
    const raw = localStorage.getItem(KEY);
    queue = raw ? (JSON.parse(raw) as ListenEvent[]) : [];
  } catch {
    queue = [];
  }
  return queue;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(queue ?? []));
  } catch {
    // quota / navigation privée : la file reste en mémoire
  }
}

function prune(now: number) {
  const q = load();
  queue = q
    .filter((e) => now - new Date(e.occurred_at).getTime() < MAX_AGE_MS)
    .slice(-MAX_QUEUE);
}

export function recordListenEvent(
  kind: ListenEventKind,
  trackId: string,
  positionSeconds: number,
  now: Date = new Date(),
) {
  const q = load();
  q.push({
    client_event_id: newEventId(),
    track_id: trackId,
    kind,
    occurred_at: now.toISOString(),
    position_seconds: Math.max(0, Math.round(positionSeconds * 10) / 10),
    device_id: getDeviceId(),
  });
  save();
}

export function pendingListenEvents(): readonly ListenEvent[] {
  return load();
}

/** Envoie la file par lots de 100. Sans effet si rien n'attend. */
export function flushListenEvents({ keepalive = false } = {}): Promise<void> {
  if (inFlight && !keepalive) return inFlight;
  prune(Date.now());
  const batch = load().slice(0, MAX_BATCH);
  if (batch.length === 0) return Promise.resolve();
  const run = postListenEvents(batch, { keepalive })
    .then(() => {
      const sent = new Set(batch.map((e) => e.client_event_id));
      queue = load().filter((e) => !sent.has(e.client_event_id));
      save();
    })
    .catch(() => {
      // hors ligne ou serveur indisponible : on garde la file
    })
    .finally(() => {
      if (inFlight === run) inFlight = null;
    });
  if (!keepalive) inFlight = run;
  return run;
}

/** Tests uniquement. */
export function resetListenEventsForTests() {
  queue = null;
  inFlight = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignoré
  }
}
