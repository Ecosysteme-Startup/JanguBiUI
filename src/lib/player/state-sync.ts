import { getAccessToken, getRefreshToken } from '@/lib/api-client';

import { putPlaybackState } from './api';
import { getDeviceId } from './device';

/**
 * Écriture de l'état de lecture (`PUT /audio/lecture/etat/`, contrat §3) :
 * toutes les 15 s pendant la lecture, à la pause, en changeant de piste, à
 * la fermeture de l'onglet (`pagehide`, en `fetch keepalive`) et au lancement
 * de la lecture avec `playing: true` (décision 10 : le serveur met en pause
 * les autres appareils du compte).
 *
 * Pourquoi pas `navigator.sendBeacon` : il n'envoie que des POST et ne pose
 * pas l'en-tête `Authorization` ; `fetch(…, {keepalive: true})` survit aussi à
 * la fermeture de la page et garde le verbe PUT et le jeton.
 */

export const STATE_INTERVAL_MS = 15_000;

let lastSent: { trackId: string; position: number } | null = null;

function hasSession(): boolean {
  return !!getAccessToken() || !!getRefreshToken();
}

export async function reportPlaybackState({
  trackId,
  position,
  keepalive = false,
  playing = false,
  now = new Date(),
}: {
  trackId: string;
  position: number;
  keepalive?: boolean;
  /** Lancement de la lecture sur cet appareil (une lecture à la fois). */
  playing?: boolean;
  now?: Date;
}) {
  if (!hasSession()) return null;
  const rounded = Math.max(0, Math.round(position * 10) / 10);
  if (
    !playing &&
    lastSent &&
    lastSent.trackId === trackId &&
    Math.abs(lastSent.position - rounded) < 0.5
  ) {
    return null;
  }
  lastSent = { trackId, position: rounded };
  try {
    return await putPlaybackState(
      {
        track_id: trackId,
        position_seconds: rounded,
        device_id: getDeviceId(),
        client_updated_at: now.toISOString(),
        playing,
      },
      { keepalive },
    );
  } catch {
    // réseau coupé : le prochain relevé (15 s) retentera
    lastSent = null;
    return null;
  }
}

/** Tests uniquement. */
export function resetStateSyncForTests() {
  lastSent = null;
}
