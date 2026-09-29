import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type {
  Album,
  Playlist,
  Source,
  StaffAlbum,
  StaffTrack,
  Track,
} from '@/features/sonotheque/types/schemas';

import { networkDelay } from '../utils';

import { estMembreDe } from './paroisses';

// Sonothèque paroissiale — données fictives des maquettes C2
// (ECRANS-V2-SONOTHEQUE §3) : Saint-Dominique (Point E), dimanche 27 septembre
// 2026. Contrat : jangubi/docs/API-AUDIO.md.

const A = `${env.API_URL}/v1/audio`;

const NOEUD_SD = {
  id: '5b7d2c1e-8a41-4f0b-9d7e-2c3f1a6b9e01',
  name: 'Saint-Dominique',
};
const NOEUD_MEDINA = {
  id: '5b7d2c1e-8a41-4f0b-9d7e-2c3f1a6b9e02',
  name: 'Saint-Joseph de Médina',
};

const src = (s: Source) => ({ id: s.id, name: s.name, kind: s.kind });

export const SOURCES: Source[] = [
  {
    id: '0f6a9c2d-3b1e-4d7a-8c5f-6e2b1a9d4c11',
    name: 'Chorale Saint-Joseph de Médina',
    kind: 'chorale',
    description: 'Chorale de la paroisse Saint-Joseph de Médina.',
    node: NOEUD_MEDINA,
    cover_url: null,
    is_active: true,
  },
  {
    id: '0f6a9c2d-3b1e-4d7a-8c5f-6e2b1a9d4c10',
    name: 'Chorale Sainte-Cécile',
    kind: 'chorale',
    description:
      'Chorale de la paroisse Saint-Dominique (Point E), sous la direction d’Élisabeth Gomis.',
    node: NOEUD_SD,
    cover_url: null,
    is_active: true,
  },
  {
    id: '3a8e1c5b-7d2f-4b9a-8e6c-1f4d7a2b9c30',
    name: 'Mouvement des Scouts',
    kind: 'mouvement',
    description: 'Groupe scout de Saint-Dominique.',
    node: NOEUD_SD,
    cover_url: null,
    is_active: true,
  },
  {
    id: '7c1e4b2a-9d3f-4a6e-b8c1-2d5f7a9e3b20',
    name: 'Paroisse Saint-Dominique',
    kind: 'paroisse',
    description:
      'Messes, homélies et enseignements de la paroisse Saint-Dominique.',
    node: NOEUD_SD,
    cover_url: null,
    is_active: true,
  },
];
const [SJ, SC, SCOUTS, SD] = SOURCES;

const album = (a: Omit<Album, 'cover_url' | 'verrouille'>): Album => ({
  ...a,
  cover_url: null,
  verrouille: false,
});

export const ALBUMS: Album[] = [
  album({
    id: 'a3d9e7f1-2c4b-4e8a-9f1d-6b2c8e4a7d30',
    source: src(SD),
    kind: 'messe',
    title: 'Messe du 27 septembre 2026',
    description:
      'Messe de 9 h 30 présidée par l’Abbé Augustin Ndiaye, homélie du Père Emmanuel Tine.',
    visibility: 'paroisse',
    recorded_on: '2026-09-27',
    liturgical_season: 'ordinaire',
    published_at: '2026-09-27T12:05:00Z',
  }),
  album({
    id: 'b8e2f4a6-1d3c-4b9e-8a7f-5c2d9e1b6a40',
    source: src(SD),
    kind: 'homelies',
    title: 'Homélies du temps ordinaire',
    description:
      'Homélies du Père Emmanuel Tine, du 21e au 26e dimanche (année A).',
    visibility: 'public',
    recorded_on: null,
    liturgical_season: 'ordinaire',
    published_at: '2026-09-27T10:44:00Z',
  }),
  album({
    id: 'c6a1d9e3-4f2b-4a7c-9e8d-2b5f1c7a3e50',
    source: src(SC),
    kind: 'album',
    title: 'Chants de la Visitation',
    description:
      'Enregistré lors de la veillée mariale du samedi 30 mai 2026, en l’église Saint-Dominique, sous la direction d’Élisabeth Gomis.',
    visibility: 'public',
    recorded_on: '2026-05-30',
    liturgical_season: '',
    published_at: '2026-09-20T17:00:00Z',
  }),
  album({
    id: 'd4b8e2c6-9a1f-4d3e-8b7c-5a2e9f1d6c60',
    source: src(SCOUTS),
    kind: 'album',
    title: 'Veillée scoute de la rentrée',
    description: 'Chants de la veillée du 12 septembre.',
    visibility: 'public',
    recorded_on: '2026-09-12',
    liturgical_season: '',
    published_at: '2026-09-12T21:00:00Z',
  }),
  album({
    id: 'e9c3f7a1-5b2d-4e8f-a6c9-3d1b7e5f2a70',
    source: src(SD),
    kind: 'retraite',
    title: 'Retraite de carême 2026',
    description: 'Six enseignements de l’Abbé Augustin Ndiaye, du 6 au 8 mars.',
    visibility: 'paroisse',
    recorded_on: '2026-03-06',
    liturgical_season: 'careme',
    published_at: '2026-03-12T09:00:00Z',
  }),
  album({
    id: 'f2a6c8e4-7d1b-4c9a-8e3f-6b4d2a9c1e80',
    source: src(SJ),
    kind: 'album',
    title: 'Chants à Marie de Médina',
    description: '',
    visibility: 'public',
    recorded_on: null,
    liturgical_season: '',
    published_at: '2026-08-15T10:00:00Z',
  }),
  // Décision 4 (maquette WEB-FID-Album) : réservé aux paroissiens de
  // Saint-Joseph de Médina ; Marie-Thérèse n'en est pas membre.
  album({
    id: 'f2a6c8e4-7d1b-4c9a-8e3f-6b4d2a9c1e81',
    source: src(SJ),
    kind: 'messe',
    title: 'Messe de la Saint-Joseph 2026',
    description:
      'Messe de la solennité de saint Joseph, patron de la paroisse, jeudi 19 mars 2026 en l’église Saint-Joseph de Médina.',
    visibility: 'paroisse',
    recorded_on: '2026-03-19',
    liturgical_season: 'careme',
    published_at: '2026-03-24T10:00:00Z',
  }),
];
const [MESSE, HOMELIES, VISITATION, VEILLEE, RETRAITE, MEDINA, SAINT_JOSEPH] =
  ALBUMS;

/** Nœud (paroisse) de chaque source : sert au verrouillage des albums. */
const NOEUD_DE_SOURCE: Record<string, { id: string; name: string }> =
  Object.fromEntries(SOURCES.map((s) => [s.id, s.node ?? NOEUD_SD]));

/** Album réservé aux paroissiens d'une autre paroisse : l'API répond 404. */
export const ALBUM_RESERVE_ID = '99999999-0000-4000-8000-000000000001';

let n = 0;
const piste = (
  alb: Album,
  title: string,
  duree: number,
  extra: Partial<Track> = {},
): Track => {
  n += 1;
  return {
    id: `70000000-0000-4000-8000-${n.toString().padStart(12, '0')}`,
    title,
    performers: [alb.source.name],
    composer: '',
    language: 'fr',
    liturgical_season: alb.liturgical_season,
    tags: [],
    description: '',
    duration_seconds: duree,
    source: alb.source,
    album: { id: alb.id, title: alb.title, kind: alb.kind },
    position: null,
    visibility: alb.visibility,
    published_at: alb.published_at,
    verrouille: false,
    ...extra,
  };
};

const numeroter = (ts: Track[]) =>
  ts.map((t, i) => ({ ...t, position: i + 1 }));

export const PISTES_VISITATION = numeroter([
  piste(VISITATION, 'Magnificat', 266, {
    language: 'la',
    composer: 'Grégorien, 8e ton',
  }),
  piste(VISITATION, 'Je vous salue, Marie', 198, {
    composer: 'Harmonisation Élisabeth Gomis',
  }),
  piste(VISITATION, 'Marie, mère très sainte', 232, {
    composer: 'Traditionnel',
  }),
  piste(VISITATION, 'Réjouis-toi, Marie', 185, {
    composer: 'Harmonisation Élisabeth Gomis',
  }),
  piste(VISITATION, 'Ave Maria', 161, {
    language: 'la',
    composer: 'Grégorien',
  }),
  piste(VISITATION, 'Sub tuum praesidium', 118, {
    language: 'la',
    composer: 'Grégorien',
  }),
  piste(VISITATION, 'Rendons grâce à Dieu', 254, {
    composer: 'Traditionnel',
  }),
  piste(VISITATION, 'Bénie entre toutes les femmes', 217, {
    composer: 'Chant de la Visitation',
  }),
  piste(VISITATION, 'Regina caeli', 144, {
    language: 'la',
    composer: 'Grégorien',
  }),
  piste(VISITATION, 'Salve Regina', 190, {
    language: 'la',
    composer: 'Hermann Contract',
  }),
  piste(VISITATION, 'Marie, notre mère', 213, {
    composer: 'Traditionnel',
  }),
]);

export const PISTES_MESSE = numeroter([
  piste(MESSE, 'Chant d’entrée', 245),
  piste(MESSE, 'Kyrie', 215, { composer: 'Abbé Joseph Faye' }),
  piste(MESSE, 'Évangile · Matthieu 21, 28-32', 164),
  piste(MESSE, 'Homélie · Lequel des deux a fait la volonté du père ?', 878, {
    performers: ['Père Emmanuel Tine'],
  }),
  piste(MESSE, 'Offertoire · Merci, Seigneur', 266),
]);

export const PISTES_HOMELIES = numeroter([
  piste(HOMELIES, '24e dimanche · Pardonner soixante-dix fois sept fois', 801, {
    performers: ['Père Emmanuel Tine'],
  }),
  piste(HOMELIES, '25e dimanche · Les ouvriers de la onzième heure', 832, {
    performers: ['Père Emmanuel Tine'],
  }),
  piste(HOMELIES, '26e dimanche · Les deux fils', 878, {
    performers: ['Père Emmanuel Tine'],
  }),
]);

export const PISTES_RETRAITE = numeroter([
  piste(RETRAITE, 'Le désert, lieu de la rencontre', 2140),
  piste(RETRAITE, 'Revenez à moi de tout votre cœur', 2310),
  piste(RETRAITE, 'Le jeûne qui plaît à Dieu', 2207),
]);

export const PISTES_VEILLEE = numeroter([
  piste(VEILLEE, 'Notre-Dame de Popenguine', 204),
  piste(VEILLEE, 'Chant de la promesse', 176),
]);

export const PISTES_MEDINA = numeroter([
  piste(MEDINA, 'Ave Maria', 175, { language: 'la' }),
  piste(MEDINA, 'Mère Marie', 221),
]);

export const PISTES_SAINT_JOSEPH = numeroter([
  piste(SAINT_JOSEPH, 'Hymne à saint Joseph', 234, {
    composer: 'Traditionnel',
  }),
  piste(SAINT_JOSEPH, 'Kyrie de Médina', 172, {
    composer: 'Messe de Médina, Paul Sarr',
  }),
  piste(SAINT_JOSEPH, 'Gloire à Dieu', 221, {
    composer: 'Messe de Médina, Paul Sarr',
  }),
  piste(
    SAINT_JOSEPH,
    'Psaume 88 (89) — Sans fin, Seigneur, je chanterai ta grâce',
    192,
    { composer: 'Psalmodie de la chorale' },
  ),
  piste(SAINT_JOSEPH, 'Alléluia', 104, {
    language: 'la',
    composer: 'Grégorien',
  }),
  piste(SAINT_JOSEPH, 'Credo III', 245, {
    language: 'la',
    composer: 'Grégorien',
  }),
  piste(SAINT_JOSEPH, 'Offertoire — Saint Joseph, gardien du Rédempteur', 218, {
    composer: 'Harmonisation de la chorale',
  }),
  piste(SAINT_JOSEPH, 'Sanctus', 130, {
    language: 'la',
    composer: 'Grégorien',
  }),
  piste(SAINT_JOSEPH, 'Agnus Dei', 146, {
    language: 'la',
    composer: 'Grégorien',
  }),
  piste(SAINT_JOSEPH, 'Ave Maria', 177, {
    language: 'la',
    composer: 'Grégorien',
  }),
]);

const PISTES_PAR_ALBUM: Record<string, Track[]> = {
  [MESSE.id]: PISTES_MESSE,
  [HOMELIES.id]: PISTES_HOMELIES,
  [VISITATION.id]: PISTES_VISITATION,
  [VEILLEE.id]: PISTES_VEILLEE,
  [RETRAITE.id]: PISTES_RETRAITE,
  [MEDINA.id]: PISTES_MEDINA,
  [SAINT_JOSEPH.id]: PISTES_SAINT_JOSEPH,
};

// ------------------------------------------------ verrouillage (décision 4)

/** Paroisse dont il faut être membre pour ce contenu `paroisse`. */
const paroisseRequise = (sourceId: string) => NOEUD_DE_SOURCE[sourceId] ?? null;

/** Réservé aux paroissiens d'une paroisse dont on n'est pas membre. */
const estVerrouille = (visibility: string, sourceId: string) => {
  if (visibility !== 'paroisse') return false;
  const p = paroisseRequise(sourceId);
  return !!p && !estMembreDe(p.id);
};

const albumVu = (a: Album) => ({
  ...a,
  verrouille: estVerrouille(a.visibility, a.source.id),
});
const pisteVue = (t: Track) => ({
  ...t,
  verrouille: estVerrouille(t.visibility, t.source.id),
});

const TOUTES = Object.values(PISTES_PAR_ALBUM).flat();

export const PLAYLISTS: Playlist[] = [
  {
    id: 'e1c7a2d4-8b3f-4e6a-9c1d-7f2b5a8e3c90',
    title: 'Pour prier le matin',
    description: 'Psaumes, prières et chants doux pour commencer la journée.',
    visibility: 'public',
    is_editorial: true,
    source: src(SD),
    track_count: 4,
    updated_at: '2026-09-20T18:00:00Z',
  },
  {
    id: 'e1c7a2d4-8b3f-4e6a-9c1d-7f2b5a8e3c91',
    title: 'Chants à Marie',
    description: 'Pour le mois du Rosaire, en français et en latin.',
    visibility: 'public',
    is_editorial: true,
    source: src(SD),
    track_count: 5,
    updated_at: '2026-09-26T18:00:00Z',
  },
  {
    id: 'e1c7a2d4-8b3f-4e6a-9c1d-7f2b5a8e3c92',
    title: 'Mes chants de mariage',
    description: '',
    visibility: 'prive',
    is_editorial: false,
    source: null,
    track_count: 3,
    updated_at: '2026-09-21T11:00:00Z',
  },
];
const PISTES_PLAYLIST: Record<string, Track[]> = {
  [PLAYLISTS[0].id]: [
    PISTES_HOMELIES[2],
    PISTES_VISITATION[1],
    PISTES_VISITATION[5],
    PISTES_VEILLEE[0],
  ],
  [PLAYLISTS[1].id]: [
    PISTES_VISITATION[0],
    PISTES_VISITATION[2],
    PISTES_MEDINA[0],
    PISTES_VISITATION[9],
    PISTES_MEDINA[1],
  ],
  [PLAYLISTS[2].id]: [
    PISTES_VISITATION[1],
    PISTES_VISITATION[6],
    PISTES_VISITATION[3],
  ],
};

// ------------------------------------------------------------ état fidèle
const likes = new Set<string>([
  PISTES_VISITATION[0].id,
  PISTES_VISITATION[9].id,
]);
let recommandations = true;

const erreur = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message, details: {} } }, { status });

const sansAccents = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ------------------------------------------------------------ état staff
const staff = (t: Track, extra: Partial<StaffTrack> = {}): StaffTrack => ({
  ...t,
  own_visibility: t.visibility,
  status: 'pret',
  failure_reason: null,
  version: 1,
  encoded_version: 1,
  encoded_at: t.published_at,
  hidden_at: null,
  created_at: t.published_at,
  updated_at: t.published_at,
  encoding_step: 'termine',
  encoding_percent: 100,
  plays_30d: null,
  ...extra,
});

const staffTracks: StaffTrack[] = [
  staff(
    piste(MESSE, 'Chant d’envoi · Allez dans le monde entier', 0, {
      published_at: null,
    }),
    {
      status: 'echec',
      encoding_step: 'analyse',
      encoding_percent: 5,
      failure_reason:
        'Le fichier s’arrête à 3 min 12 s alors que son en-tête annonce 3 min 48 s : il est incomplet ou endommagé.',
      duration_seconds: null,
      encoded_version: null,
      updated_at: '2026-09-27T10:58:00Z',
    },
  ),
  staff(
    piste(MESSE, 'Prière universelle', 245, {
      published_at: null,
    }),
    {
      status: 'encodage',
      encoding_step: 'qualites',
      encoding_percent: 62,
      encoded_version: null,
      updated_at: '2026-09-27T10:52:00Z',
    },
  ),
  staff(PISTES_MESSE[3], { plays_30d: 31, updated_at: '2026-09-27T10:41:00Z' }),
  staff(PISTES_MESSE[4], { plays_30d: 12, updated_at: '2026-09-27T10:41:00Z' }),
  staff(PISTES_MESSE[2], { plays_30d: 18, updated_at: '2026-09-27T10:40:00Z' }),
  staff(PISTES_HOMELIES[2], {
    plays_30d: 27,
    updated_at: '2026-09-27T10:44:00Z',
  }),
  staff(
    piste(MESSE, 'Louange d’ouverture', 372, {
      visibility: 'prive',
      published_at: null,
    }),
    {
      status: 'brouillon',
      encoding_step: '',
      encoding_percent: 0,
      encoded_version: null,
      updated_at: '2026-09-24T19:00:00Z',
    },
  ),
  staff(
    piste(MESSE, 'Méditation · Jean 15, 1-8', 587, {
      visibility: 'prive',
      published_at: null,
    }),
    {
      status: 'en_file',
      encoding_step: '',
      encoding_percent: 0,
      encoded_version: null,
      updated_at: '2026-09-24T19:05:00Z',
    },
  ),
  staff(PISTES_VISITATION[0], {
    plays_30d: 186,
    updated_at: '2026-09-20T17:00:00Z',
  }),
  staff(PISTES_VISITATION[2], {
    plays_30d: 141,
    updated_at: '2026-09-20T17:00:00Z',
  }),
  staff(PISTES_VISITATION[9], {
    plays_30d: 118,
    updated_at: '2026-09-20T17:00:00Z',
  }),
  staff(PISTES_HOMELIES[1], {
    plays_30d: 64,
    updated_at: '2026-09-20T12:00:00Z',
  }),
  staff(PISTES_VISITATION[6], {
    plays_30d: 57,
    updated_at: '2026-09-20T17:00:00Z',
  }),
  staff(PISTES_RETRAITE[2], {
    plays_30d: 22,
    updated_at: '2026-03-12T09:00:00Z',
  }),
];

/** Envois en cours du serveur de mocks : nombre de consultations du suivi. */
const envois = new Map<
  string,
  { track: StaffTrack; consultations: number; tronque: boolean }
>();

/**
 * Progression de l'encodage du serveur de mocks, une étape par consultation
 * du suivi (valeurs du contrat B3b §2 : analyse 5, normalisation 15,
 * qualités 30 à 63, forme d'onde 80 puis 90, terminé 100).
 */
const PROGRESSION: Pick<StaffTrack, 'encoding_step' | 'encoding_percent'>[] = [
  { encoding_step: 'analyse', encoding_percent: 5 },
  { encoding_step: 'normalisation', encoding_percent: 15 },
  { encoding_step: 'qualites', encoding_percent: 41 },
  { encoding_step: 'forme_onde', encoding_percent: 80 },
];

const avancer = (e: {
  track: StaffTrack;
  consultations: number;
  tronque: boolean;
}) => {
  e.consultations += 1;
  const c = e.consultations;
  if (e.tronque && c >= 2) {
    e.track = {
      ...e.track,
      status: 'echec',
      encoding_step: 'analyse',
      encoding_percent: 5,
      failure_reason:
        'Le fichier s’arrête avant la fin annoncée par son en-tête : il est incomplet ou endommagé. Trois tentatives automatiques ont été faites.',
    };
  } else if (c >= 6) {
    e.track = {
      ...e.track,
      status: 'pret',
      encoding_step: 'termine',
      encoding_percent: 100,
      duration_seconds: e.track.duration_seconds ?? 245,
      encoded_version: e.track.version,
    };
  } else if (c >= 2) {
    e.track = { ...e.track, status: 'encodage', ...PROGRESSION[c - 2] };
  }
  return e.track;
};

// ------------------------------------------------------------ albums staff
const albumsGeres = new Set([SC.id, SCOUTS.id, SD.id]);
const compterPistes = (albumId: string) =>
  (PISTES_PAR_ALBUM[albumId]?.length ?? 0) +
  staffTracks.filter(
    (t) => t.album?.id === albumId && !TOUTES.some((x) => x.id === t.id),
  ).length;

const versStaff = (a: Album, extra: Partial<StaffAlbum> = {}): StaffAlbum => ({
  ...a,
  track_count: compterPistes(a.id),
  hidden_at: null,
  created_at: a.published_at,
  updated_at: a.published_at,
  ...extra,
});

/** Album brouillon de la maquette WEB-PAR-Sonotheque (pas encore publié). */
export const ALBUM_BROUILLON_ID = 'a7c2e9f4-3b1d-4e6a-8f2c-9d4b1e7a5c90';

export const STAFF_ALBUMS: StaffAlbum[] = [
  versStaff(
    {
      id: ALBUM_BROUILLON_ID,
      source: src(SD),
      kind: 'album',
      title: 'Veillée de prière de la rentrée',
      description: 'Louange et méditation du jeudi 24 septembre.',
      visibility: 'prive',
      cover_url: null,
      recorded_on: '2026-09-24',
      liturgical_season: 'ordinaire',
      published_at: null,
      verrouille: false,
    },
    {
      track_count: 2,
      created_at: '2026-09-24T18:40:00Z',
      updated_at: '2026-09-24T19:05:00Z',
    },
  ),
  ...ALBUMS.filter((a) => albumsGeres.has(a.source.id))
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))
    .map((a) => versStaff(a)),
];
const staffAlbums: StaffAlbum[] = STAFF_ALBUMS.map((a) => ({ ...a }));

/** Pochettes en cours d'envoi : file_id → album. */
const pochettes = new Map<number, string>();
let prochainFichier = 1289;

/** Signalements reçus (tests). */
export const signalements: {
  cible: 'piste' | 'album';
  id: string;
  motif: string;
  comment: string;
}[] = [];

/** Remet l'état staff du serveur de mocks à zéro (tests). */
export function resetSonothequeMocks() {
  staffAlbums.splice(
    0,
    staffAlbums.length,
    ...STAFF_ALBUMS.map((a) => ({ ...a })),
  );
  pochettes.clear();
  signalements.length = 0;
}

export const sonothequeHandlers = [
  // -------------------------------------------------------- catalogue
  http.get(`${A}/sources/`, async ({ request }) => {
    await networkDelay();
    const kind = new URL(request.url).searchParams.get('kind');
    return HttpResponse.json(
      kind ? SOURCES.filter((s) => s.kind === kind) : SOURCES,
    );
  }),

  http.get(`${A}/sources/:id/`, async ({ params }) => {
    await networkDelay();
    const source = SOURCES.find((s) => s.id === params.id);
    if (!source)
      return erreur(404, 'source_introuvable', 'Source introuvable.');
    const albums = ALBUMS.filter((a) => a.source.id === source.id);
    const pistes = albums.flatMap((a) => PISTES_PAR_ALBUM[a.id] ?? []);
    return HttpResponse.json({
      source,
      albums: albums.map(albumVu),
      playlists: PLAYLISTS.filter(
        (p) => p.is_editorial && p.source?.id === source.id,
      ),
      recent: pistes.slice(0, 6).map(pisteVue),
      most_played: [...pistes].reverse().slice(0, 5).map(pisteVue),
    });
  }),

  http.get(`${A}/albums/`, async ({ request }) => {
    await networkDelay();
    const q = new URL(request.url).searchParams;
    const kind = q.get('kind');
    const source = q.get('source');
    return HttpResponse.json(
      ALBUMS.filter(
        (a) =>
          (!kind || a.kind === kind) && (!source || a.source.id === source),
      ).map(albumVu),
    );
  }),

  http.get(`${A}/albums/:id/`, async ({ params }) => {
    await networkDelay();
    const a = ALBUMS.find((x) => x.id === params.id);
    if (!a) return erreur(404, 'album_introuvable', 'Album introuvable.');
    const tracks = (PISTES_PAR_ALBUM[a.id] ?? []).map(pisteVue);
    const reserve =
      a.visibility === 'paroisse' ||
      tracks.some((t) => t.visibility === 'paroisse');
    return HttpResponse.json({
      album: albumVu(a),
      tracks,
      paroisse_requise: reserve ? paroisseRequise(a.source.id) : null,
    });
  }),

  http.get(`${A}/pistes/:id/ensuite/`, async ({ params }) => {
    await networkDelay();
    return HttpResponse.json(
      [PISTES_MEDINA[0], PISTES_VEILLEE[0], PISTES_VISITATION[9]].filter(
        (t) => t.id !== params.id,
      ),
    );
  }),

  http.post(`${A}/pistes/:id/lecture/`, async ({ params }) => {
    await networkDelay();
    const t = TOUTES.find((x) => x.id === params.id);
    if (!t) return erreur(404, 'piste_introuvable', 'Piste introuvable.');
    if (estVerrouille(t.visibility, t.source.id)) {
      const paroisse = paroisseRequise(t.source.id);
      return HttpResponse.json(
        {
          error: {
            code: 'reserve_paroissiens',
            message: `Réservé aux paroissiens de ${paroisse?.name ?? 'la paroisse'}.`,
            details: { paroisse },
          },
        },
        { status: 403 },
      );
    }
    return HttpResponse.json({
      track: t,
      stream: {
        format: 'hls',
        master_url: `https://audio.jangubi.sn/audio-hls/${t.id}/1/master.m3u8?verify=demo`,
        mp3_url: `https://audio.jangubi.sn/audio-hls/${t.id}/1/audio.mp3?verify=demo`,
        expires_at: '2026-09-27T17:20:00Z',
      },
      resume: null,
      waveform: [],
    });
  }),

  http.put(`${A}/pistes/:id/like/`, ({ params }) => {
    likes.add(params.id as string);
    return HttpResponse.json({ liked: true });
  }),
  http.delete(`${A}/pistes/:id/like/`, ({ params }) => {
    likes.delete(params.id as string);
    return HttpResponse.json({ liked: false });
  }),

  http.post(`${A}/pistes/:id/signaler/`, async ({ params, request }) => {
    const body = (await request.json()) as { motif: string; comment: string };
    signalements.push({ cible: 'piste', id: params.id as string, ...body });
    return HttpResponse.json(
      { id: signalements.length, cible: 'piste', status: 'ouvert' },
      { status: 201 },
    );
  }),

  http.post(`${A}/albums/:id/signaler/`, async ({ params, request }) => {
    const a = ALBUMS.find((x) => x.id === params.id);
    if (!a) return erreur(404, 'album_introuvable', 'Album introuvable.');
    const body = (await request.json()) as { motif: string; comment: string };
    signalements.push({ cible: 'album', id: a.id, ...body });
    return HttpResponse.json(
      {
        id: signalements.length,
        cible: 'album',
        track: null,
        album: a,
        motif: body.motif,
        comment: body.comment,
        status: 'ouvert',
        created_at: new Date().toISOString(),
        handled_at: null,
      },
      { status: 201 },
    );
  }),

  // -------------------------------------------------------- recherche
  http.get(`${A}/recherche/`, async ({ request }) => {
    await networkDelay();
    const q = sansAccents(
      new URL(request.url).searchParams.get('q') ?? '',
    ).trim();
    if (q.length < 2) {
      return erreur(
        400,
        'recherche_trop_courte',
        'Saisissez au moins deux caractères.',
      );
    }
    const results = TOUTES.filter((t) =>
      [
        t.title,
        t.source.name,
        t.album?.title ?? '',
        t.composer,
        ...t.performers,
        t.description,
      ]
        .map(sansAccents)
        .some((s) => s.includes(q)),
    );
    return HttpResponse.json({
      results: results.map(pisteVue),
      next_cursor: null,
    });
  }),

  // -------------------------------------------------------- bibliothèque
  http.get(`${A}/bibliotheque/`, async () => {
    await networkDelay();
    return HttpResponse.json({
      likes: TOUTES.filter((t) => likes.has(t.id)),
      playlists: PLAYLISTS.filter((p) => !p.is_editorial),
      recent: [
        {
          track: PISTES_HOMELIES[1],
          position_seconds: 472,
          updated_at: '2026-09-26T21:40:00Z',
          device_id: 'ios-mt-diouf',
        },
        {
          track: PISTES_RETRAITE[2],
          position_seconds: 947,
          updated_at: '2026-09-25T19:10:00Z',
          device_id: 'web-mt-diouf',
        },
      ],
    });
  }),

  http.get(`${A}/playlists/:id/`, async ({ params }) => {
    await networkDelay();
    const p = PLAYLISTS.find((x) => x.id === params.id);
    if (!p) return erreur(404, 'playlist_introuvable', 'Playlist introuvable.');
    return HttpResponse.json({
      playlist: p,
      tracks: PISTES_PLAYLIST[p.id] ?? [],
    });
  }),

  http.post(`${A}/playlists/`, async ({ request }) => {
    const body = (await request.json()) as {
      title: string;
      visibility: 'prive' | 'public';
    };
    const p: Playlist = {
      id: crypto.randomUUID(),
      title: body.title,
      description: '',
      visibility: body.visibility,
      is_editorial: false,
      source: null,
      track_count: 0,
      updated_at: new Date().toISOString(),
    };
    PLAYLISTS.push(p);
    return HttpResponse.json(p, { status: 201 });
  }),

  // -------------------------------------------------------- accueil
  http.get(`${A}/accueil/`, async () => {
    await networkDelay();
    const deMaParoisse = new Set(
      SOURCES.filter((x) => x.node?.id === NOEUD_SD.id).map((x) => x.id),
    );
    const nouveautes = TOUTES.filter((t) => deMaParoisse.has(t.source.id))
      .filter((t) => t.published_at)
      .sort((a, b) =>
        (b.published_at ?? '').localeCompare(a.published_at ?? ''),
      )
      .slice(0, 10);
    return HttpResponse.json({
      paroisse: NOEUD_SD,
      reprendre: [
        {
          track: PISTES_RETRAITE[2],
          position_seconds: 947,
          updated_at: '2026-09-25T19:10:00Z',
          device_id: 'web-mt-diouf',
        },
        {
          track: PISTES_HOMELIES[1],
          position_seconds: 472,
          updated_at: '2026-09-26T21:40:00Z',
          device_id: 'ios-mt-diouf',
        },
      ],
      nouveautes_ma_paroisse: nouveautes,
      pour_vous: recommandations
        ? [
            {
              track: PISTES_VISITATION[9],
              reason: 'Parce que vous avez écouté Magnificat',
            },
            {
              track: PISTES_MEDINA[0],
              reason: 'Pour le mois du Rosaire, qui commence jeudi',
            },
            {
              track: PISTES_HOMELIES[0],
              reason: 'Suite de la série que vous écoutez',
            },
            {
              track: PISTES_VEILLEE[0],
              reason: 'Aimé par des fidèles qui aiment vos chants',
            },
          ]
        : [
            {
              track: PISTES_MESSE[3],
              reason: 'Nouveauté de Paroisse Saint-Dominique',
            },
            { track: PISTES_HOMELIES[2], reason: 'Pour le temps ordinaire' },
          ],
      playlists_paroisse: PLAYLISTS.filter(
        (p) => p.is_editorial && p.source && deMaParoisse.has(p.source.id),
      ),
      temps_liturgique: {
        code: 'ordinaire',
        label: 'Temps ordinaire',
        tracks: [PISTES_HOMELIES[2], PISTES_MESSE[1], PISTES_HOMELIES[1]],
      },
    });
  }),

  // -------------------------------------------------------- recommandations
  http.get(`${A}/reglages/`, () =>
    HttpResponse.json({ recommendations_enabled: recommandations }),
  ),
  http.get(`${A}/pour-vous/`, async () => {
    await networkDelay();
    return HttpResponse.json({
      personnalise: recommandations,
      demarrage_a_froid: false,
      results: [
        {
          track: PISTES_VISITATION[9],
          reason: 'Parce que vous avez écouté Magnificat',
        },
        {
          track: PISTES_MEDINA[0],
          reason: 'Pour le mois du Rosaire, qui commence jeudi',
        },
        {
          track: PISTES_HOMELIES[0],
          reason: 'Suite de la série que vous écoutez',
        },
        {
          track: PISTES_VEILLEE[0],
          reason: 'Aimé par des fidèles qui aiment vos chants',
        },
      ],
    });
  }),
  http.put(`${A}/reglages/`, async ({ request }) => {
    const body = (await request.json()) as { recommendations_enabled: boolean };
    recommandations = body.recommendations_enabled;
    return HttpResponse.json({ recommendations_enabled: recommandations });
  }),

  // -------------------------------------------------------- staff
  http.get(`${A}/staff/sources/`, async () => {
    await networkDelay();
    return HttpResponse.json([SC, SCOUTS, SD]);
  }),

  http.get(`${A}/staff/pistes/`, async ({ request }) => {
    await networkDelay();
    const source = new URL(request.url).searchParams.get('source');
    return HttpResponse.json(
      staffTracks.filter((t) => !source || t.source.id === source),
    );
  }),

  http.post(`${A}/uploads/`, async ({ request }) => {
    await networkDelay();
    const body = (await request.json()) as {
      source_id: string;
      album_id?: string;
      title: string;
      visibility: StaffTrack['visibility'];
      file_name: string;
      file_size: number;
      rights_confirmed: boolean;
    };
    if (!body.rights_confirmed) {
      return erreur(
        400,
        'droits_non_confirmes',
        'Confirmez que vous disposez des droits de diffusion.',
      );
    }
    const s = SOURCES.find((x) => x.id === body.source_id) ?? SD;
    const alb = staffAlbums.find((a) => a.id === body.album_id);
    const id = crypto.randomUUID();
    const track: StaffTrack = staff(
      {
        ...piste(alb ?? MESSE, body.title, 0),
        id,
        source: src(s),
        album: alb ? { id: alb.id, title: alb.title, kind: alb.kind } : null,
        visibility: body.visibility,
        published_at: null,
      },
      {
        status: 'brouillon',
        version: 0,
        encoded_version: null,
        duration_seconds: null,
      },
    );
    envois.set(id, {
      track,
      consultations: 0,
      tronque: /envoi|tronque/i.test(body.file_name),
    });
    return HttpResponse.json(
      {
        upload_id: id,
        track,
        method: 'POST',
        // Stockage local (développement) : champ `file` seul, jeton requis.
        url: `${A}/uploads/${id}/local/`,
        fields: {},
        max_size: 524288000,
        expires_in: 3600,
      },
      { status: 201 },
    );
  }),

  http.post(
    `${A}/uploads/:id/local/`,
    () => new HttpResponse(null, { status: 204 }),
  ),

  http.post(`${A}/uploads/:id/terminer/`, async ({ params }) => {
    await networkDelay();
    const e = envois.get(params.id as string);
    if (!e)
      return erreur(
        400,
        'upload_absent',
        'Le fichier n’est pas encore arrivé.',
      );
    e.track = { ...e.track, status: 'en_file', version: 1 };
    return HttpResponse.json(e.track, { status: 202 });
  }),

  http.get(`${A}/uploads/:id/`, async ({ params }) => {
    await networkDelay();
    const e = envois.get(params.id as string);
    if (!e) return erreur(404, 'upload_introuvable', 'Envoi introuvable.');
    return HttpResponse.json(avancer(e));
  }),

  http.post(`${A}/pistes/:id/reencoder/`, async ({ params }) => {
    await networkDelay();
    const e = envois.get(params.id as string);
    if (e) {
      e.tronque = false;
      e.consultations = 1;
      e.track = {
        ...e.track,
        status: 'en_file',
        failure_reason: null,
        version: e.track.version + 1,
      };
      return HttpResponse.json(e.track, { status: 202 });
    }
    const t = staffTracks.find((x) => x.id === params.id);
    if (!t) return erreur(404, 'piste_introuvable', 'Piste introuvable.');
    t.status = 'en_file';
    t.failure_reason = null;
    return HttpResponse.json(t, { status: 202 });
  }),

  http.post(`${A}/pistes/:id/publier/`, async ({ params }) => {
    const e = envois.get(params.id as string);
    const t = e?.track ?? staffTracks.find((x) => x.id === params.id);
    if (!t) return erreur(404, 'piste_introuvable', 'Piste introuvable.');
    if (t.status !== 'pret')
      return erreur(409, 'piste_pas_prete', 'L’encodage n’est pas terminé.');
    const publie = { ...t, published_at: new Date().toISOString() };
    if (e) e.track = publie;
    return HttpResponse.json(publie);
  }),

  http.patch(`${A}/pistes/:id/`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<StaffTrack>;
    const e = envois.get(params.id as string);
    if (e) e.track = { ...e.track, ...body };
    return HttpResponse.json(e?.track ?? { ...staffTracks[0], ...body });
  }),

  // -------------------------------------------------------- albums staff
  http.get(`${A}/staff/albums/`, async ({ request }) => {
    await networkDelay();
    const q = new URL(request.url).searchParams;
    const source = q.get('source');
    const kind = q.get('kind');
    if (source && !albumsGeres.has(source))
      return erreur(403, 'audio_forbidden', 'Vous ne gérez pas cette source.');
    return HttpResponse.json(
      staffAlbums.filter(
        (a) =>
          (!source || a.source.id === source) && (!kind || a.kind === kind),
      ),
    );
  }),

  http.post(`${A}/staff/albums/`, async ({ request }) => {
    await networkDelay();
    const body = (await request.json()) as {
      source_id: string;
      kind: StaffAlbum['kind'];
      title: string;
      visibility: StaffAlbum['visibility'];
      description?: string;
      recorded_on?: string | null;
      liturgical_season?: string;
    };
    const s = SOURCES.find((x) => x.id === body.source_id);
    if (!s || !albumsGeres.has(s.id))
      return erreur(403, 'audio_forbidden', 'Vous ne gérez pas cette source.');
    if (!body.title?.trim())
      return erreur(400, 'titre_requis', 'Donnez un titre à l’album.');
    const maintenant = new Date().toISOString();
    const a: StaffAlbum = {
      id: crypto.randomUUID(),
      source: src(s),
      kind: body.kind,
      title: body.title.trim(),
      description: body.description ?? '',
      visibility: body.visibility,
      cover_url: null,
      recorded_on: body.recorded_on ?? null,
      liturgical_season: body.liturgical_season ?? '',
      published_at: null,
      verrouille: false,
      track_count: 0,
      hidden_at: null,
      created_at: maintenant,
      updated_at: maintenant,
    };
    staffAlbums.unshift(a);
    return HttpResponse.json(a, { status: 201 });
  }),

  http.get(`${A}/staff/albums/:id/`, async ({ params }) => {
    await networkDelay();
    const a = staffAlbums.find((x) => x.id === params.id);
    if (!a) return erreur(404, 'album_introuvable', 'Album introuvable.');
    const publiees = (PISTES_PAR_ALBUM[a.id] ?? []).map((t) => {
      const connue = staffTracks.find((x) => x.id === t.id);
      return connue ?? staff(t, { plays_30d: 0 });
    });
    const autres = staffTracks.filter(
      (t) => t.album?.id === a.id && !publiees.some((p) => p.id === t.id),
    );
    return HttpResponse.json({ album: a, tracks: [...publiees, ...autres] });
  }),

  http.patch(`${A}/staff/albums/:id/`, async ({ params, request }) => {
    await networkDelay();
    const a = staffAlbums.find((x) => x.id === params.id);
    if (!a) return erreur(404, 'album_introuvable', 'Album introuvable.');
    const body = (await request.json()) as Partial<StaffAlbum>;
    Object.assign(a, body, { updated_at: new Date().toISOString() });
    return HttpResponse.json(a);
  }),

  http.post(`${A}/albums/:id/publier/`, async ({ params }) => {
    await networkDelay();
    const a = staffAlbums.find((x) => x.id === params.id);
    if (!a) return erreur(404, 'album_introuvable', 'Album introuvable.');
    a.published_at = a.published_at ?? new Date().toISOString();
    return HttpResponse.json(a);
  }),

  http.post(`${A}/staff/albums/:id/pochette/`, async ({ params, request }) => {
    await networkDelay();
    const a = staffAlbums.find((x) => x.id === params.id);
    if (!a) return erreur(404, 'album_introuvable', 'Album introuvable.');
    const body = (await request.json()) as {
      file_name: string;
      file_type: string;
      file_size: number;
    };
    if (!/\.(jpe?g|png|webp)$/i.test(body.file_name))
      return erreur(
        400,
        'format_image',
        'La pochette doit être une image JPG, PNG ou WebP.',
      );
    if (body.file_size > 5 * 1024 * 1024)
      return erreur(400, 'image_trop_grosse', 'L’image dépasse 5 Mo.');
    const fileId = prochainFichier++;
    pochettes.set(fileId, a.id);
    return HttpResponse.json(
      {
        file_id: fileId,
        method: 'POST',
        // Stockage local (développement) : champ `file` seul, jeton requis.
        url: `${A}/staff/albums/${a.id}/pochette/${fileId}/local/`,
        fields: {},
        max_size: 5242880,
        expires_in: 3600,
      },
      { status: 201 },
    );
  }),

  http.post(
    `${A}/staff/albums/:id/pochette/:fileId/local/`,
    () => new HttpResponse(null, { status: 204 }),
  ),

  http.post(
    `${A}/staff/albums/:id/pochette/terminer/`,
    async ({ params, request }) => {
      await networkDelay();
      const body = (await request.json()) as { file_id: number };
      const a = staffAlbums.find((x) => x.id === params.id);
      if (!a || pochettes.get(Number(body.file_id)) !== a.id)
        return erreur(
          404,
          'pochette_introuvable',
          'Cette pochette n’appartient pas à l’album.',
        );
      a.cover_url = `https://stockage.jangubi.sn/audio-covers/${a.id}/${body.file_id}.jpg`;
      a.updated_at = new Date().toISOString();
      return HttpResponse.json(a);
    },
  ),
];
