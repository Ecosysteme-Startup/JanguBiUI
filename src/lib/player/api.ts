import { api } from '@/lib/api-client';
import { silent } from '@/lib/silent-request';

import {
  type Lecture,
  type ListenEvent,
  lectureSchema,
  type PlaybackState,
  playbackStateSchema,
  putPlaybackStateResponseSchema,
  type Track,
  trackSchema,
} from './types';

/**
 * Appels de la sonothèque utilisés par le lecteur global (contrat
 * docs/API-AUDIO.md, §3, §5, §6, §7, §8).
 *
 * - Les actions de la personne (lancer une piste, aimer, signaler) passent
 *   par `api` (toast en cas d'erreur).
 * - Les appels de fond (état de lecture toutes les 15 s, événements d'écoute,
 *   « À écouter ensuite ») passent par `silent()` : aucune notification à
 *   l'écran si le réseau tombe, on réessaiera plus tard.
 */

export const AUDIO = '/v1/audio';

/** `POST /audio/pistes/<id>/lecture/` : URL signée, reprise, forme d'onde. */
export async function fetchLecture(trackId: string): Promise<Lecture> {
  // `quiet` : le lecteur affiche lui-même l'erreur (404, 409, 403
  // `reserve_paroissiens` avec « Ajouter cette paroisse »), sans toast.
  const data = await api.post<unknown>(
    `${AUDIO}/pistes/${encodeURIComponent(trackId)}/lecture/`,
    undefined,
    { quiet: true },
  );
  return lectureSchema.parse(data);
}

/** `GET /audio/lecture/etat/` : `null` si aucune écoute (204). */
export async function fetchPlaybackState(): Promise<PlaybackState | null> {
  const { data } = await silent(`${AUDIO}/lecture/etat/`);
  if (!data) return null;
  return playbackStateSchema.parse(data);
}

export interface PutStateBody {
  track_id: string;
  position_seconds: number;
  device_id: string;
  client_updated_at: string;
  /**
   * Décision 10 : `true` quand cet appareil lance la lecture ; le serveur
   * met alors en pause les autres appareils du compte (`playback.state`
   * action `pause`). `false` (défaut) : pause, sauvegarde périodique.
   */
  playing?: boolean;
}

/** `PUT /audio/lecture/etat/` (dernière écriture gagnante). */
export async function putPlaybackState(
  body: PutStateBody,
  { keepalive = false } = {},
) {
  const { data } = await silent(`${AUDIO}/lecture/etat/`, {
    method: 'PUT',
    body,
    keepalive,
  });
  if (!data) return null;
  return putPlaybackStateResponseSchema.parse(data);
}

/** `POST /audio/evenements/` : lot de 100 événements au plus. */
export async function postListenEvents(
  events: ListenEvent[],
  { keepalive = false } = {},
) {
  return silent(`${AUDIO}/evenements/`, {
    method: 'POST',
    body: { events },
    keepalive,
  });
}

/** `GET /audio/pistes/<id>/ensuite/` : « À écouter ensuite ». */
export async function fetchNextUp(trackId: string): Promise<Track[]> {
  const { data } = await silent<unknown[]>(
    `${AUDIO}/pistes/${encodeURIComponent(trackId)}/ensuite/`,
  );
  return (data ?? []).map((t) => trackSchema.parse(t));
}

/** `GET /audio/pistes/<id>/`. */
export async function fetchTrack(trackId: string): Promise<Track> {
  const { data } = await silent(
    `${AUDIO}/pistes/${encodeURIComponent(trackId)}/`,
  );
  return trackSchema.parse(data);
}

/** `PUT` / `DELETE /audio/pistes/<id>/like/`. */
export async function setTrackLiked(trackId: string, liked: boolean) {
  const url = `${AUDIO}/pistes/${encodeURIComponent(trackId)}/like/`;
  return liked ? api.put(url) : api.delete(url);
}

export type ReportMotif = 'droits' | 'inapproprie' | 'qualite' | 'autre';

/** `POST /audio/pistes/<id>/signaler/`. */
export async function reportTrack(
  trackId: string,
  motif: ReportMotif,
  comment = '',
) {
  return api.post(`${AUDIO}/pistes/${encodeURIComponent(trackId)}/signaler/`, {
    motif,
    comment,
  });
}
