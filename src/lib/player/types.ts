import * as z from 'zod';

/**
 * Objet `Track` du contrat de la sonothèque (docs/API-AUDIO.md du backend).
 * Schéma volontairement tolérant : le lecteur ne dépend que de `id`, `title`
 * et `duration_seconds` ; le reste sert à l'affichage.
 *
 * Champs hors contrat, facultatifs, que la sonothèque peut fournir pour
 * enrichir l'affichage : `cover_url` (piste ou album), `reason` (raison courte
 * d'une recommandation), `readings` (lectures de la messe liées).
 */
export const trackSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    duration_seconds: z.number().nonnegative().default(0),
    performers: z.array(z.string()).default([]),
    composer: z.string().nullish(),
    language: z.string().nullish(),
    liturgical_season: z.string().nullish(),
    tags: z.array(z.string()).default([]),
    description: z.string().nullish(),
    source: z
      .object({ id: z.string(), name: z.string(), kind: z.string().nullish() })
      .nullish(),
    album: z
      .object({
        id: z.string(),
        title: z.string(),
        kind: z.string().nullish(),
        cover_url: z.string().nullish(),
        recorded_on: z.string().nullish(),
      })
      .nullish(),
    position: z.number().nullish(),
    visibility: z.string().nullish(),
    published_at: z.string().nullish(),
    cover_url: z.string().nullish(),
    reason: z.string().nullish(),
    readings: z.array(z.string()).nullish(),
    liked: z.boolean().nullish(),
  })
  .passthrough();

export type Track = z.infer<typeof trackSchema>;
/** Ce que la sonothèque passe à `playTracks` : un `Track` du contrat. */
export type TrackInput = z.input<typeof trackSchema>;

export const lectureSchema = z.object({
  track: trackSchema,
  stream: z.object({
    format: z.string().default('hls'),
    master_url: z.string(),
    mp3_url: z.string().nullish(),
    expires_at: z.string().nullish(),
  }),
  resume: z
    .object({
      position_seconds: z.number(),
      device_id: z.string().nullish(),
      updated_at: z.string().nullish(),
    })
    .nullable()
    .default(null),
  waveform: z.array(z.number()).default([]),
});

export type Lecture = z.infer<typeof lectureSchema>;
export type StreamInfo = Lecture['stream'];

export const playbackStateSchema = z.object({
  track: trackSchema,
  position_seconds: z.number(),
  device_id: z.string(),
  updated_at: z.string(),
});

export type PlaybackState = z.infer<typeof playbackStateSchema>;

export const putPlaybackStateResponseSchema = z.object({
  applied: z.boolean(),
  state: playbackStateSchema.nullish(),
});

/**
 * Événement `playback.state` reçu sur `ws/notifications/` (TEMPS-REEL §2.6) :
 * - `etat` : un autre appareil a écrit sa position (« Reprendre sur cet
 *   appareil ») ; sans `action`, c'est aussi un `etat` ;
 * - `pause` : un appareil vient de lancer la lecture ; tous les autres
 *   (`device_id` ≠ `sauf_device_id`) se mettent en pause (décision 10).
 */
export const playbackEtatEventSchema = z.object({
  event_type: z.literal('playback.state'),
  action: z.literal('etat').optional(),
  playing: z.boolean().optional(),
  track_id: z.string(),
  position_seconds: z.number(),
  device_id: z.string(),
  updated_at: z.string(),
});

export const playbackPauseEventSchema = z.object({
  event_type: z.literal('playback.state'),
  action: z.literal('pause'),
  sauf_device_id: z.string(),
  track_id: z.string().nullish(),
  device_id: z.string().nullish(),
});

export const playbackStateEventSchema = z.union([
  playbackPauseEventSchema,
  playbackEtatEventSchema,
]);

export type PlaybackStateEvent = z.infer<typeof playbackStateEventSchema>;

export type ListenEventKind =
  | 'start'
  | 'progress'
  | 'complete'
  | 'skip'
  | 'like';

export interface ListenEvent {
  client_event_id: string;
  track_id: string;
  kind: ListenEventKind;
  occurred_at: string;
  position_seconds: number;
  device_id: string;
}

/** D'où vient la file : affiché « Lecture depuis l'album … » dans le lecteur. */
export interface PlayContext {
  /** Ex. « l'album », « la playlist », « la recherche ». */
  kindLabel?: string;
  /** Ex. « Messe du 27 septembre 2026 ». */
  label: string;
  /** Lien vers la page de l'album / de la playlist. */
  href?: string;
}

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export type Quality = 'auto' | 'economie' | 'haute';

export type RepeatMode = 'off' | 'all' | 'one';

export type SleepTimer =
  | { mode: 'off' }
  | { mode: 'minutes'; minutes: number; endsAt: number }
  | { mode: 'fin_piste' };

/** Offre « Reprendre sur cet appareil » (autre appareil, même compte). */
export interface ResumeOffer {
  track: Track;
  positionSeconds: number;
  deviceId: string;
  updatedAt: string;
}

/**
 * Lecture refusée : piste réservée aux paroissiens (403 `reserve_paroissiens`,
 * décision 4). `paroisse` sert à « Ajouter cette paroisse » (`null` si le
 * contenu relève d'un nœud au-dessus de la paroisse).
 */
export interface ReserveParoissiens {
  message: string;
  paroisse: { id: string; name: string } | null;
}

/** Vitesse mémorisée par type de contenu (spec lecteur, décision 4). */
export type SpeedBucket = 'parole' | 'musique';
