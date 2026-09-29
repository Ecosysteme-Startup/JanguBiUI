import { z } from 'zod';

// Contrat : jangubi/docs/API-AUDIO.md (lot B3). Le schéma OpenAPI fait foi pour
// les types ; les schémas Zod ci-dessous valident les réponses côté web.

export const VISIBILITES = ['public', 'paroisse', 'prive'] as const;
export const visibiliteSchema = z.enum(VISIBILITES);
export type Visibilite = z.infer<typeof visibiliteSchema>;

export const SOURCE_KINDS = ['paroisse', 'chorale', 'mouvement'] as const;
export const sourceKindSchema = z.enum(SOURCE_KINDS);
export type SourceKind = z.infer<typeof sourceKindSchema>;

export const ALBUM_KINDS = ['album', 'messe', 'homelies', 'retraite'] as const;
export const albumKindSchema = z.enum(ALBUM_KINDS);
export type AlbumKind = z.infer<typeof albumKindSchema>;

export const LANGUES = ['fr', 'wo', 'la', 'srr', 'dyo', 'en', 'autre'] as const;
export type Langue = (typeof LANGUES)[number];

export const TEMPS_LITURGIQUES = [
  'avent',
  'noel',
  'careme',
  'triduum',
  'paques',
  'ordinaire',
] as const;

export const TRACK_STATUSES = [
  'brouillon',
  'en_file',
  'encodage',
  'pret',
  'echec',
] as const;
export const trackStatusSchema = z.enum(TRACK_STATUSES);
export type TrackStatus = z.infer<typeof trackStatusSchema>;

export const ENCODING_STEPS = [
  '',
  'analyse',
  'normalisation',
  'qualites',
  'forme_onde',
  'termine',
] as const;
/** Valeur inconnue ou absente → `""` (le suivi reste lisible). */
export const encodingStepSchema = z.enum(ENCODING_STEPS).catch('');
export type EncodingStep = (typeof ENCODING_STEPS)[number];

export const sourceRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: sourceKindSchema,
});
export type SourceRef = z.infer<typeof sourceRefSchema>;

export const albumRefSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: albumKindSchema,
});
export type AlbumRef = z.infer<typeof albumRefSchema>;

export const trackSchema = z.object({
  id: z.string(),
  title: z.string(),
  performers: z.array(z.string()).default([]),
  composer: z.string().default(''),
  language: z.string().default(''),
  liturgical_season: z.string().default(''),
  tags: z.array(z.string()).default([]),
  description: z.string().default(''),
  duration_seconds: z.number().nullable().default(null),
  source: sourceRefSchema,
  album: albumRefSchema.nullable().default(null),
  position: z.number().nullable().default(null),
  visibility: visibiliteSchema,
  published_at: z.string().nullable().default(null),
});
export type Track = z.infer<typeof trackSchema>;

export const staffTrackSchema = trackSchema.extend({
  own_visibility: visibiliteSchema.optional(),
  status: trackStatusSchema,
  failure_reason: z.string().nullable().default(null),
  version: z.number().default(0),
  encoded_version: z.number().nullable().default(null),
  encoded_at: z.string().nullable().default(null),
  hidden_at: z.string().nullable().default(null),
  created_at: z.string().nullable().default(null),
  updated_at: z.string().nullable().optional(),
  /** Étape de l'encodage (contrat B3b §2) ; `""` : pas encore commencé. */
  encoding_step: encodingStepSchema,
  /** Avancement de l'encodage, 0 à 100. */
  encoding_percent: z.number().min(0).max(100).nullable().default(null),
  /**
   * Débuts d'écoute des 30 derniers jours (staff seulement, listes d'une
   * source ou d'un album) ; `null` ailleurs. Jamais comparés entre sources.
   */
  plays_30d: z.number().int().nullable().default(null),
});
export type StaffTrack = z.infer<typeof staffTrackSchema>;

export const sourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: sourceKindSchema,
  description: z.string().default(''),
  node: z.object({ id: z.string(), name: z.string() }).nullable().default(null),
  cover_url: z.string().nullable().default(null),
  is_active: z.boolean().default(true),
});
export type Source = z.infer<typeof sourceSchema>;

export const albumSchema = z.object({
  id: z.string(),
  source: sourceRefSchema,
  kind: albumKindSchema,
  title: z.string(),
  description: z.string().default(''),
  visibility: visibiliteSchema,
  cover_url: z.string().nullable().default(null),
  recorded_on: z.string().nullable().default(null),
  liturgical_season: z.string().default(''),
  published_at: z.string().nullable().default(null),
});
export type Album = z.infer<typeof albumSchema>;

export const playlistSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(''),
  visibility: visibiliteSchema,
  is_editorial: z.boolean().default(false),
  source: sourceRefSchema.nullable().default(null),
  track_count: z.number().default(0),
  updated_at: z.string().nullable().default(null),
});
export type Playlist = z.infer<typeof playlistSchema>;

export const sourceDetailSchema = z.object({
  source: sourceSchema,
  albums: z.array(albumSchema).default([]),
  playlists: z.array(playlistSchema).default([]),
  recent: z.array(trackSchema).default([]),
  most_played: z.array(trackSchema).default([]),
});
export type SourceDetail = z.infer<typeof sourceDetailSchema>;

export const albumDetailSchema = z.object({
  album: albumSchema,
  tracks: z.array(trackSchema).default([]),
});
export type AlbumDetail = z.infer<typeof albumDetailSchema>;

export const playlistDetailSchema = z.object({
  playlist: playlistSchema,
  tracks: z.array(trackSchema).default([]),
});
export type PlaylistDetail = z.infer<typeof playlistDetailSchema>;

export const recentSchema = z.object({
  track: trackSchema,
  position_seconds: z.number(),
  updated_at: z.string(),
  /** Appareil de la dernière écriture, si le backend le renvoie. */
  device_id: z.string().nullable().optional(),
});
export type Recent = z.infer<typeof recentSchema>;

export const bibliothequeSchema = z.object({
  likes: z.array(trackSchema).default([]),
  playlists: z.array(playlistSchema).default([]),
  recent: z.array(recentSchema).default([]),
});
export type Bibliotheque = z.infer<typeof bibliothequeSchema>;

export const rechercheSchema = z.object({
  results: z.array(trackSchema),
  next_cursor: z.string().nullable(),
});
export type Recherche = z.infer<typeof rechercheSchema>;

export const pourVousSchema = z.object({
  personnalise: z.boolean(),
  demarrage_a_froid: z.boolean(),
  results: z.array(z.object({ track: trackSchema, reason: z.string() })),
});
export type PourVous = z.infer<typeof pourVousSchema>;

export const lectureSchema = z.object({
  track: trackSchema,
  stream: z.object({
    format: z.string(),
    master_url: z.string(),
    mp3_url: z.string().nullable().optional(),
    expires_at: z.string(),
  }),
  resume: z
    .object({
      position_seconds: z.number(),
      device_id: z.string().nullable().optional(),
      updated_at: z.string(),
    })
    .nullable(),
  waveform: z.array(z.number()).default([]),
});
export type Lecture = z.infer<typeof lectureSchema>;

export const uploadInitSchema = z.object({
  upload_id: z.string(),
  track: staffTrackSchema,
  method: z.string().default('POST'),
  url: z.string(),
  fields: z.record(z.string()).default({}),
  max_size: z.number(),
  expires_in: z.number(),
});
export type UploadInit = z.infer<typeof uploadInitSchema>;

// ------------------------------------------------------------ B3b : staff

/** Album vu du staff : brouillons (`published_at: null`) et retraits compris. */
export const staffAlbumSchema = albumSchema.extend({
  track_count: z.number().int().default(0),
  hidden_at: z.string().nullable().default(null),
  created_at: z.string().nullable().default(null),
  updated_at: z.string().nullable().default(null),
});
export type StaffAlbum = z.infer<typeof staffAlbumSchema>;

export const staffAlbumDetailSchema = z.object({
  album: staffAlbumSchema,
  tracks: z.array(staffTrackSchema).default([]),
});
export type StaffAlbumDetail = z.infer<typeof staffAlbumDetailSchema>;

/** POST présigné de la pochette (`audio-covers/<album_id>/…`). */
export const pochetteInitSchema = z.object({
  file_id: z.union([z.number(), z.string()]),
  method: z.string().default('POST'),
  url: z.string(),
  fields: z.record(z.string()).default({}),
  max_size: z.number(),
  expires_in: z.number(),
});
export type PochetteInit = z.infer<typeof pochetteInitSchema>;

// ------------------------------------------------------------ B3b : accueil

export const accueilSchema = z.object({
  paroisse: z.object({ id: z.string(), name: z.string() }).nullable(),
  reprendre: z.array(recentSchema).default([]),
  nouveautes_ma_paroisse: z.array(trackSchema).default([]),
  pour_vous: z
    .array(z.object({ track: trackSchema, reason: z.string() }))
    .default([]),
  playlists_paroisse: z.array(playlistSchema).default([]),
  temps_liturgique: z
    .object({
      code: z.string(),
      label: z.string(),
      tracks: z.array(trackSchema).default([]),
    })
    .nullable()
    .default(null),
});
export type Accueil = z.infer<typeof accueilSchema>;
