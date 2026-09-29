import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type { TrackInput } from '@/lib/player/types';

import { networkDelay } from '../utils';

// Données fictives du lecteur (spec ECRANS-V2-LECTEUR §3) : dimanche
// 27 septembre 2026, « Gloria — Messe de la Visitation », chorale
// Sainte-Cécile de Saint-Dominique. Identifiants du contrat API-AUDIO.md.

const API = `${env.API_URL}/v1/audio`;

const UNSPLASH = 'https://images.unsplash.com';
const PHOTO = '?w=800&q=70&fm=jpg&fit=crop';
export const COVERS = {
  vitrail: `${UNSPLASH}/photo-1691036073374-b638e4c285f1${PHOTO}`,
  bancs: `${UNSPLASH}/photo-1725654020255-6d98526b01c8${PHOTO}`,
};

// Enregistrements libres (Wikimedia Commons) : MP3 de secours joué en
// développement, quand l'URL HLS fictive ne répond pas.
const COMMONS = 'https://upload.wikimedia.org/wikipedia/commons';
const MP3 = [
  `${COMMONS}/transcoded/4/46/Petits_Chanteurs_de_Passy_-_Salve_Regina_de_Hermann_Contract.ogg/Petits_Chanteurs_de_Passy_-_Salve_Regina_de_Hermann_Contract.ogg.mp3`,
  `${COMMONS}/transcoded/2/23/Schola_Gregoriana-Ave_Maria.ogg/Schola_Gregoriana-Ave_Maria.ogg.mp3`,
];

const CHORALE = {
  id: '0f6a9c2d-3b1e-4d7a-8c5f-6e2b1a9d4c10',
  name: 'Chorale Sainte-Cécile',
  kind: 'chorale',
};
const PAROISSE = {
  id: '7c1e4b2a-9d3f-4a6e-b8c1-2d5f7a9e3b20',
  name: 'Paroisse Saint-Dominique',
  kind: 'paroisse',
};
const MESSE = {
  id: 'a3d9e7f1-2c4b-4e8a-9f1d-6b2c8e4a7d30',
  title: 'Messe du 27 septembre 2026',
  kind: 'messe',
  cover_url: COVERS.vitrail,
  recorded_on: '2026-09-27',
};
const HOMELIES = {
  id: 'b8e2f4a6-1d3c-4b9e-8a7f-5c2d9e1b6a40',
  title: 'Homélies du Père Emmanuel Tine',
  kind: 'homelies',
  cover_url: COVERS.bancs,
  recorded_on: '2026-09-26',
};

const READINGS = ['Ez 18, 25-28', 'Ps 24 (25)', 'Ph 2, 1-11', 'Mt 21, 28-32'];

function messeTrack(
  position: number,
  id: string,
  title: string,
  duration: number,
  extra: Partial<TrackInput> = {},
): TrackInput {
  return {
    id,
    title,
    duration_seconds: duration,
    performers: ['Direction : Élisabeth Gomis'],
    composer: null,
    language: 'fr',
    liturgical_season: 'ordinaire',
    tags: ['messe'],
    description: '',
    source: CHORALE,
    album: MESSE,
    position,
    visibility: 'public',
    published_at: '2026-09-27T12:10:00Z',
    readings: READINGS,
    ...extra,
  };
}

export const GLORIA_ID = 'd2b7e9c4-6a1f-4d8b-b3e5-9c1a4f7d2e60';
export const KYRIE_ID = 'c4f1a8e2-7b3d-4c9a-a1e6-3f8d2b7c5e50';
export const HOMELIE_ID = 'e5a1c7d3-2b4f-4e6a-9c8d-1f3b5a7c9e70';

/** Album « Messe du 27 septembre 2026 » : 10 pistes, 38 min. */
export const messeTracks: TrackInput[] = [
  messeTrack(
    1,
    '1a2b3c4d-0001-4a00-8000-000000000001',
    'Chant d’entrée — Peuple de Dieu, marche joyeux',
    490,
  ),
  messeTrack(2, KYRIE_ID, 'Kyrie — Messe de la Visitation', 210, {
    composer: 'Joseph Mendy, Messe de la Visitation (2019)',
  }),
  messeTrack(3, GLORIA_ID, 'Gloria — Messe de la Visitation', 252, {
    performers: [
      'Direction : Élisabeth Gomis',
      'Soliste : Awa Faye, soprano',
      'Orgue : Paul Diatta',
      'Percussions : Michel Badji',
    ],
    composer: 'Joseph Mendy, Messe de la Visitation (2019)',
    description:
      'Gloria de la Messe de la Visitation, écrite par Joseph Mendy pour les vingt ans de la chorale. Le refrain est repris par l’assemblée.',
  }),
  messeTrack(
    4,
    '1a2b3c4d-0004-4a00-8000-000000000004',
    'Psaume 24 (25) — Rappelle-toi, Seigneur',
    185,
    {
      performers: ['Soliste : Awa Faye'],
    },
  ),
  messeTrack(
    5,
    '1a2b3c4d-0005-4a00-8000-000000000005',
    'Alléluia — Messe de la Visitation',
    98,
  ),
  messeTrack(
    6,
    '1a2b3c4d-0006-4a00-8000-000000000006',
    'Procession des offrandes',
    260,
  ),
  messeTrack(
    7,
    '1a2b3c4d-0007-4a00-8000-000000000007',
    'Sanctus — Messe de la Visitation',
    168,
  ),
  messeTrack(
    8,
    '1a2b3c4d-0008-4a00-8000-000000000008',
    'Agnus Dei — Messe de la Visitation',
    150,
  ),
  messeTrack(
    9,
    '1a2b3c4d-0009-4a00-8000-000000000009',
    'Chant de communion',
    292,
  ),
  messeTrack(
    10,
    '1a2b3c4d-0010-4a00-8000-000000000010',
    'Envoi — Allez dans le monde',
    165,
  ),
];

export const homelieTrack: TrackInput = {
  id: HOMELIE_ID,
  title: 'Homélie du samedi 26 septembre',
  duration_seconds: 708,
  performers: ['Père Emmanuel Tine'],
  composer: null,
  language: 'fr',
  liturgical_season: 'ordinaire',
  tags: ['homélie'],
  description: 'Homélie de la messe de 7 h, sur Luc 9, 43b-45.',
  source: PAROISSE,
  album: HOMELIES,
  position: 12,
  visibility: 'public',
  published_at: '2026-09-26T09:00:00Z',
  readings: ['Lc 9, 43b-45'],
};

/** « À écouter ensuite » après le Gloria, avec leur raison courte. */
export const recommendationTracks: TrackInput[] = [
  {
    id: '2b3c4d5e-0001-4b00-8000-000000000001',
    title: 'Gloria du 15 août 2026',
    duration_seconds: 247,
    performers: [],
    tags: ['messe'],
    liturgical_season: 'ordinaire',
    source: CHORALE,
    album: {
      id: '2b3c4d5e-a001-4b00-8000-00000000a001',
      title: 'Messe de l’Assomption',
      kind: 'messe',
      cover_url: COVERS.vitrail,
    },
    reason: 'Autre enregistrement de cette messe',
  },
  {
    id: '2b3c4d5e-0002-4b00-8000-000000000002',
    title: 'Homélie du 26e dimanche — Matthieu 21, 28-32',
    duration_seconds: 850,
    performers: ['Abbé Augustin Ndiaye'],
    tags: ['homélie'],
    liturgical_season: 'ordinaire',
    source: {
      id: '2b3c4d5e-5001-4b00-8000-000000005001',
      name: 'Abbé Augustin Ndiaye',
      kind: 'paroisse',
    },
    album: {
      id: '2b3c4d5e-a002-4b00-8000-00000000a002',
      title: 'Homélies dominicales',
      kind: 'homelies',
      cover_url: COVERS.bancs,
    },
    reason: 'En lien avec l’Évangile de ce dimanche',
  },
  {
    id: '2b3c4d5e-0003-4b00-8000-000000000003',
    title: 'Magnificat',
    duration_seconds: 227,
    performers: [],
    tags: ['chant'],
    source: {
      id: '2b3c4d5e-5002-4b00-8000-000000005002',
      name: 'Chorale Saint-Joseph de Médina',
      kind: 'chorale',
    },
    album: {
      id: '2b3c4d5e-a003-4b00-8000-00000000a003',
      title: 'Chants à Marie',
      kind: 'album',
      cover_url: null,
    },
    reason: 'Souvent écouté après la Messe de la Visitation',
  },
];

const allTracks = (): TrackInput[] => [
  ...messeTracks,
  homelieTrack,
  ...recommendationTracks,
];

/** 200 pics entre 0 et 1 : attaque douce, refrain plus fort, fin qui s'éteint. */
export function mockWaveform(seed = 1): number[] {
  return Array.from({ length: 200 }, (_, i) => {
    const t = i / 199;
    const envelope = Math.sin(Math.PI * Math.min(1, t * 1.15)) * 0.7 + 0.2;
    const ripple =
      0.12 * Math.sin(i * 0.9 + seed) + 0.08 * Math.sin(i * 2.3 + seed * 2);
    return (
      Math.round(Math.min(1, Math.max(0.05, envelope + ripple)) * 100) / 100
    );
  });
}

// État de lecture serveur (dernière écriture gagnante).
const DEVICE_PAROISSE = 'web-ordinateur-paroisse';
let serverState: {
  track_id: string;
  position_seconds: number;
  device_id: string;
  updated_at: string;
} | null = null;

function initialState() {
  // « Vous écoutiez sur l'ordinateur de la paroisse » : Gloria arrêté à 1:47.
  return {
    track_id: GLORIA_ID,
    position_seconds: 107,
    device_id: DEVICE_PAROISSE,
    updated_at: new Date(Date.now() - 28 * 60_000).toISOString(),
  };
}

const positions = new Map<string, number>();
/** Dernier `playing` reçu par `PUT lecture/etat/` (tests). */
let lastPlaying = false;
export const dernierPlaying = () => lastPlaying;
const liked = new Set<string>([GLORIA_ID]);

export function resetAudioLecteurMocks() {
  serverState = initialState();
  positions.clear();
  lastPlaying = false;
  liked.clear();
  liked.add(GLORIA_ID);
}
resetAudioLecteurMocks();

function findTrack(id: string) {
  const t = allTracks().find((x) => x.id === id);
  return t ? { ...t, liked: liked.has(t.id) } : undefined;
}

function notFound() {
  return HttpResponse.json(
    {
      error: {
        code: 'piste_introuvable',
        message: 'Piste introuvable.',
        details: {},
      },
    },
    { status: 404 },
  );
}

export const audioLecteurHandlers = [
  http.post(`${API}/pistes/:id/lecture/`, async ({ params }) => {
    await networkDelay();
    const id = String(params.id);
    const track = findTrack(id);
    // Piste du catalogue de la sonothèque : handler suivant (sonotheque.ts).
    if (!track) return undefined;
    const index = allTracks().findIndex((t) => t.id === id);
    const verify =
      'verify=1790532000-3q2Nf0x8m1YxJ4b2kQ0hZ6s9tR5vW7yA1cE3gI5kM7o';
    const saved = positions.get(id) ?? (id === GLORIA_ID ? 112 : null);
    return HttpResponse.json({
      track,
      stream: {
        format: 'hls',
        master_url: `https://audio.jangubi.sn/audio-hls/${id}/1/master.m3u8?${verify}`,
        mp3_url: MP3[index % MP3.length],
        expires_at: new Date(Date.now() + 6 * 3600_000).toISOString(),
      },
      resume:
        saved != null
          ? {
              position_seconds: saved,
              device_id: DEVICE_PAROISSE,
              updated_at: new Date().toISOString(),
            }
          : null,
      waveform: mockWaveform(index + 1),
    });
  }),

  http.get(`${API}/lecture/etat/`, async () => {
    await networkDelay();
    if (!serverState) return new HttpResponse(null, { status: 204 });
    const track = findTrack(serverState.track_id);
    if (!track) return new HttpResponse(null, { status: 204 });
    return HttpResponse.json({
      track,
      position_seconds: serverState.position_seconds,
      device_id: serverState.device_id,
      updated_at: serverState.updated_at,
    });
  }),

  http.put(`${API}/lecture/etat/`, async ({ request }) => {
    const body = (await request.json()) as {
      track_id: string;
      position_seconds: number;
      device_id: string;
      client_updated_at: string;
      /** Décision 10 : cet appareil lit (les autres se mettent en pause). */
      playing?: boolean;
    };
    lastPlaying = body.playing ?? false;
    const track = findTrack(body.track_id);
    if (!track) return notFound();
    positions.set(body.track_id, body.position_seconds);
    const applied =
      !serverState ||
      new Date(body.client_updated_at) >= new Date(serverState.updated_at);
    if (applied) {
      serverState = {
        track_id: body.track_id,
        position_seconds: body.position_seconds,
        device_id: body.device_id,
        updated_at: body.client_updated_at,
      };
    }
    const winner = findTrack(serverState!.track_id)!;
    return HttpResponse.json({
      applied,
      state: {
        track: winner,
        position_seconds: serverState!.position_seconds,
        device_id: serverState!.device_id,
        updated_at: serverState!.updated_at,
      },
    });
  }),

  http.post(`${API}/evenements/`, async ({ request }) => {
    const body = (await request.json()) as { events?: unknown[] };
    const n = body.events?.length ?? 0;
    return HttpResponse.json(
      { recus: n, enregistres: n, doublons: 0, rejetes: 0 },
      { status: 202 },
    );
  }),

  http.get(`${API}/pistes/:id/ensuite/`, async ({ params }) => {
    await networkDelay();
    if (!findTrack(String(params.id))) return undefined;
    return HttpResponse.json(recommendationTracks);
  }),

  http.put(`${API}/pistes/:id/like/`, ({ params }) => {
    liked.add(String(params.id));
    return HttpResponse.json({ liked: true });
  }),

  http.delete(`${API}/pistes/:id/like/`, ({ params }) => {
    liked.delete(String(params.id));
    return HttpResponse.json({ liked: false });
  }),

  http.post(`${API}/pistes/:id/signaler/`, () =>
    HttpResponse.json(
      { id: 'signalement-1', statut: 'ouvert' },
      { status: 201 },
    ),
  ),

  http.get(`${API}/pistes/:id/`, ({ params }) => {
    const track = findTrack(String(params.id));
    return track ? HttpResponse.json(track) : notFound();
  }),

  // Ticket à usage unique de la socket ws/notifications/ (TEMPS-REEL §1).
  http.post(`${env.API_URL}/v1/me/ws-ticket/`, () =>
    HttpResponse.json({ ticket: `ticket-${Date.now().toString(36)}` }),
  ),
];
