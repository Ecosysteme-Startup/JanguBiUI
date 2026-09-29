import { SilentHttpError } from '@/lib/silent-request';

import { postListenEvents } from './api';
import { getDeviceId, newEventId } from './device';
import type { ListenEvent, ListenEventKind } from './types';

/**
 * File des événements d'écoute (`POST /audio/evenements/`, contrat §6).
 * - envoi en lot (100 au plus) toutes les 30 s, et à `pagehide` en keepalive ;
 * - la file est gardée dans le stockage local : une écoute hors ligne part à
 *   la reconnexion (le serveur accepte jusqu'à 7 jours) ;
 * - un lot en échec est renvoyé à l'identique (idempotence par
 *   `client_event_id` + `occurred_at`) ;
 * - limite de débit (`429`, 30 lots/min sans compte, 60 avec) : le même lot
 *   repart après le délai `Retry-After` (60 s à défaut), et aucun envoi n'est
 *   tenté avant (pas même à `pagehide` : la file reste dans le stockage local).
 */

const KEY = 'jb_player_events';
const MAX_BATCH = 100;
const MAX_AGE_MS = 7 * 24 * 3600 * 1000;
const MAX_QUEUE = 500;
/** Délai d'attente après un 429 sans en-tête `Retry-After`. */
export const DEFAULT_RETRY_AFTER_S = 60;
/** Borne haute d'attente, au cas où l'en-tête serait aberrant. */
const MAX_RETRY_AFTER_S = 15 * 60;

let queue: ListenEvent[] | null = null;
let inFlight: Promise<void> | null = null;
/** Horodatage avant lequel le serveur demande de ne rien renvoyer (429). */
let blockedUntil = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRetry(seconds: number) {
  const delay = Math.min(Math.max(seconds, 1), MAX_RETRY_AFTER_S) * 1000;
  blockedUntil = Date.now() + delay;
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    blockedUntil = 0;
    void flushListenEvents();
  }, delay);
}

/** Vrai tant qu'un `429` impose d'attendre (tests et diagnostic). */
export function listenEventsThrottled(now: number = Date.now()): boolean {
  return blockedUntil > now;
}

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
  // Limite de débit : le lot repartira tout seul après `Retry-After`.
  if (listenEventsThrottled()) return Promise.resolve();
  prune(Date.now());
  const batch = load().slice(0, MAX_BATCH);
  if (batch.length === 0) return Promise.resolve();
  const run = postListenEvents(batch, { keepalive })
    .then(() => {
      const sent = new Set(batch.map((e) => e.client_event_id));
      queue = load().filter((e) => !sent.has(e.client_event_id));
      save();
    })
    .catch((err: unknown) => {
      // Hors ligne ou serveur indisponible : on garde la file. Sur 429, on
      // renvoie le même lot (mêmes client_event_id) après le délai demandé.
      if (err instanceof SilentHttpError && err.status === 429) {
        scheduleRetry(err.retryAfter ?? DEFAULT_RETRY_AFTER_S);
      }
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
  blockedUntil = 0;
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignoré
  }
}
