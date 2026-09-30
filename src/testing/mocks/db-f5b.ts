import dayjs from 'dayjs';

import { ids } from '@/testing/mocks/db';

/** Données démo du lot F5b (Ma paroisse, notifications, profil, accueil), relatives à aujourd'hui. */
const day = (offset: number) => dayjs().add(offset, 'day').format('YYYY-MM-DD');
const at = (offset: number, time: string) => dayjs(`${day(offset)}T${time}`).toISOString();

export const f5bIds = {
  annonceQuete: '1a000000-0000-4000-8000-000000000001',
  annonceRentree: '1a000000-0000-4000-8000-000000000002',
  annonceCatechese: '1a000000-0000-4000-8000-000000000003',
  annonceMalveillante: '1a000000-0000-4000-8000-0000000000ff',
  evenementRecollection: 42,
  evenementChorale: 43,
  demande: '2d000000-0000-4000-8000-000000000001',
  pretre: '3c000000-0000-4000-8000-000000000001',
};

const category = (id: number, name: string) => ({ id, name, slug: name.toLowerCase(), icon: '', color: '', display_order: id });
const scope = { node_id: ids.saintDominique, node_name: 'Saint-Dominique', place_id: null, place_name: null };
const reactions = { counts: { pray: 0, amen: 0, attend: 0 }, mine: [] };

const summary = (a: {
  id: string;
  title: string;
  excerpt: string;
  cat: [number, string];
  sunday?: boolean;
  pinned?: boolean;
  publishedOffset: number;
  scope?: { node_id: string | null; node_name: string | null; place_id: number | null; place_name: string | null };
}) => ({
  id: a.id,
  content_type: 'announcement',
  title: a.title,
  slug: a.id,
  excerpt: a.excerpt,
  content_format: 'html',
  category: category(...a.cat),
  author_name: 'Abbé Augustin Ndiaye',
  scope: a.scope ?? scope,
  is_sunday_notice: Boolean(a.sunday),
  sunday_date: a.sunday ? day(3) : null,
  is_pinned: Boolean(a.pinned),
  pinned_until: a.pinned ? at(6, '23:59:00') : null,
  cover_image_url: null,
  cover_image_alt: '',
  cover_image_decorative: false,
  published_at: at(a.publishedOffset, '08:05:00'),
  reactions,
});

export const announcements = [
  summary({
    id: f5bIds.annonceQuete,
    title: 'Quête impérée pour le Grand Séminaire de Brin',
    excerpt: 'À toutes les messes de ce dimanche.',
    cat: [1, 'Quête'],
    sunday: true,
    pinned: true,
    publishedOffset: -1,
  }),
  summary({
    id: f5bIds.annonceRentree,
    title: 'Messe d’action de grâce pour la rentrée universitaire',
    excerpt: 'Pour toute la communauté universitaire.',
    cat: [2, 'Liturgie'],
    publishedOffset: 0,
  }),
  summary({
    id: f5bIds.annonceCatechese,
    title: 'Inscriptions au catéchisme 2026-2027',
    excerpt: 'Au secrétariat, avec l’extrait de baptême de l’enfant.',
    cat: [3, 'Catéchèse'],
    publishedOffset: -20,
  }),
];

/**
 * Fil du fidèle (`GET /me/feed/`) : annonces de la paroisse, du diocèse et contenus globaux
 * (portée nulle), épinglés en tête puis du plus récent au plus ancien, comme le serveur.
 */
export const meFeed = [
  summary({
    id: '1a000000-0000-4000-8000-000000000010',
    title: 'Lettre pastorale pour l’année de la famille',
    excerpt: 'Message de l’archevêque à tous les diocésains.',
    cat: [4, 'Diocèse'],
    pinned: true,
    publishedOffset: -3,
    scope: { node_id: ids.dakar, node_name: 'Archidiocèse de Dakar', place_id: null, place_name: null },
  }),
  announcements[0],
  announcements[1],
  summary({
    id: '1a000000-0000-4000-8000-000000000011',
    title: 'Nouveau : la Parole du jour à écouter',
    excerpt: 'Les lectures de la messe sont désormais lues à voix haute.',
    cat: [5, 'Jàngu Bi'],
    publishedOffset: -2,
    scope: { node_id: null, node_name: null, place_id: null, place_name: null },
  }),
  announcements[2],
];

export const announcementDetails: Record<string, Record<string, unknown>> = {
  [f5bIds.annonceRentree]: {
    ...announcements[1],
    content: '<h2>Un accueil pour les nouveaux bacheliers</h2><p>Les étudiants sont attendus sur le parvis dès 9 h.</p>',
    content_format: 'html',
  },
  [f5bIds.annonceQuete]: {
    ...announcements[0],
    content: 'Le produit de la quête est reversé au Grand Séminaire.\n\nMerci de votre générosité.',
    content_format: 'text',
  },
  [f5bIds.annonceMalveillante]: {
    ...announcements[2],
    id: f5bIds.annonceMalveillante,
    title: 'Annonce piégée',
    content:
      '<p onclick="alert(1)">Texte légitime</p><script>window.__pwned = true</script><img src="x" onerror="window.__pwned = true"><a href="javascript:alert(1)">Lien piégé</a><iframe src="https://evil.example"></iframe><a href="https://jangubi.sn/aide">Aide</a>',
    content_format: 'html',
  },
};

export const parishNode = {
  id: ids.saintDominique,
  type: { code: 'paroisse', label: 'Paroisse' },
  name: 'Saint-Dominique',
  code: 'SD',
  status: 'erigee',
  address: 'Point E',
  city: 'Dakar',
  lat: null,
  lng: null,
  erected_at: null,
  is_active_on_platform: true,
  located_in_id: null,
  depth: 4,
  parent_id: ids.dakar,
  has_children: false,
};

const occ = (offset: number, kind: string, start: string, end: string | null, place: [number, string], note = '') => ({
  date: day(offset),
  kind,
  start_time: start,
  end_time: end,
  place_id: place[0],
  place_name: place[1],
  language: 'fr',
  note,
  is_exception: false,
});
const eglise: [number, string] = [1, 'Église Saint-Dominique'];
const chapelle: [number, string] = [2, 'Chapelle de la Cité universitaire'];

export const parishWeek = {
  node: { id: ids.saintDominique, name: 'Saint-Dominique', code: 'SD', type: 'paroisse' },
  start: day(0),
  end: day(6),
  places: [
    { id: 2, node_id: ids.saintDominique, name: chapelle[1], kind: 'chapelle', is_main: false, address: 'Campus social', city: 'Dakar', is_active: true },
    { id: 1, node_id: ids.saintDominique, name: eglise[1], kind: 'eglise', is_main: true, address: 'Point E, avenue Cheikh Anta Diop', city: 'Dakar', is_active: true },
  ],
  occurrences: [
    occ(0, 'messe', '23:58:00', null, eglise),
    occ(1, 'messe', '07:00:00', null, eglise),
    occ(2, 'confession', '16:00:00', '18:00:00', eglise),
    occ(2, 'adoration', '20:00:00', null, chapelle, 'Adoration du jeudi'),
  ],
};

const event = (id: number, title: string, offset: number, extra: Record<string, unknown> = {}) => ({
  id,
  title,
  description: 'Une journée de silence, d’enseignement et de partage.\n\nDépart en car du parvis.',
  event_type: 'retreat',
  start_at: at(offset, '07:15:00'),
  end_at: at(offset, '17:30:00'),
  location: 'Abbaye de Keur Moussa',
  node_id: ids.saintDominique,
  node_name: 'Saint-Dominique',
  place_id: null,
  max_participants: 120,
  registration_closes_at: null as string | null,
  registrations_count: 84,
  seats_taken: 84,
  seats_remaining: 36 as number | null,
  registrations_open: true,
  my_seats: null as number | null,
  my_note: null as string | null,
  is_full: false,
  is_registered: false,
  is_cancelled: false,
  ...extra,
});

export const f5bState = {
  events: {} as Record<number, ReturnType<typeof event>>,
  preferences: {} as Record<string, unknown>,
  notifications: [] as Record<string, unknown>[],
  readIds: [] as string[],
  profilePatches: [] as Record<string, unknown>[],
  paroisseSuivie: null as string | null,
  deleted: false,
  deleteConflict: false,
  readArticles: [] as string[],
  declaration: null as Record<string, unknown> | null,
  lastRegistration: null as Record<string, unknown> | null,
};

/** Déclaration d'état de vie d'un fidèle laïc (GET /me/declaration/). */
export const laicDeclaration = (overrides: Record<string, unknown> = {}) => ({
  id: '5f0c0000-0000-4000-8000-000000000001',
  email: 'fidele@example.sn',
  full_name: 'Marie Diop',
  etat_de_vie: 'laic',
  degre_ordre: 'aucun',
  statut_verification: 'declare',
  verification_note: '',
  declared_at: null,
  incardination_node: null,
  institut_node: null,
  attachments: [],
  ...overrides,
});

/**
 * Événements des nœuds parents (diocèse), présents seulement dans le fil agrégé du fidèle
 * (`GET /agenda/` sans `node`).
 */
export const dioceseEvents = () => [
  event(50, 'Ordinations sacerdotales à la cathédrale', 9, {
    event_type: 'ordination',
    location: 'Cathédrale du Souvenir africain',
    node_id: ids.dakar,
    node_name: 'Archidiocèse de Dakar',
    max_participants: null,
    registrations_count: 0,
    seats_taken: 0,
    seats_remaining: null,
    registrations_open: false,
  }),
  event(51, 'Messe chrismale', 12, {
    event_type: 'mass',
    location: 'Cathédrale du Souvenir africain',
    node_id: ids.dakar,
    node_name: 'Archidiocèse de Dakar',
    max_participants: null,
    registrations_count: 0,
    seats_taken: 0,
    seats_remaining: null,
    registrations_open: false,
  }),
];

const now = () => dayjs();

export const resetF5bState = () => {
  f5bState.lastRegistration = null;
  f5bState.events = {
    [f5bIds.evenementRecollection]: event(f5bIds.evenementRecollection, 'Journée de récollection des CEB', 16),
    [f5bIds.evenementChorale]: event(f5bIds.evenementChorale, 'Répétition de la chorale Sainte-Cécile', 2, {
      event_type: 'other',
      max_participants: null,
      registrations_count: 0,
      seats_taken: 0,
      seats_remaining: null,
    }),
  };
  f5bState.preferences = {
    in_app: true,
    email: true,
    topic_annonces: true,
    topic_evenements: false,
    quiet_start: '22:00:00',
    quiet_end: '06:00:00',
  };
  f5bState.notifications = [
    {
      id: 'n1',
      event_type: 'new_message',
      payload: { conversation_id: 'c1', sender_id: f5bIds.pretre, sender_name: 'Père Emmanuel Tine', sent_at: now().toISOString() },
      is_read: false,
      read_at: null,
      created_at: now().subtract(5, 'minute').toISOString(),
    },
    {
      id: 'n2',
      event_type: 'news.published',
      payload: { article_id: f5bIds.annonceRentree, title: 'Messe d’action de grâce pour la rentrée universitaire', node_name: 'Saint-Dominique' },
      is_read: false,
      read_at: null,
      created_at: now().subtract(10, 'minute').toISOString(),
    },
    {
      id: 'n3',
      event_type: 'confessions.reminder',
      payload: { booking_id: 'b1', starts_at: at(2, '16:20:00'), place: 'Église Saint-Dominique' },
      is_read: false,
      read_at: null,
      created_at: now().subtract(1, 'day').toISOString(),
    },
    {
      id: 'n4',
      event_type: 'documents.status',
      payload: { request_id: f5bIds.demande, reference: 'JB-2026-00412', status: 'under_verification' },
      is_read: true,
      read_at: now().subtract(2, 'day').toISOString(),
      created_at: now().subtract(3, 'day').toISOString(),
    },
  ];
  f5bState.readIds = [];
  f5bState.profilePatches = [];
  f5bState.paroisseSuivie = null;
  f5bState.deleted = false;
  f5bState.deleteConflict = false;
  f5bState.readArticles = [];
  f5bState.declaration = laicDeclaration();
};
resetF5bState();

export const currentRequests = [
  {
    id: f5bIds.demande,
    reference: 'JB-2026-00412',
    document_type: 'bapteme',
    document_type_label: 'Extrait d’acte de baptême',
    document_type_free: '',
    reason: 'mariage',
    reason_free: '',
    status: 'under_verification',
    status_label: 'En vérification',
    target_node: { id: 'b1000000-0000-4000-8000-000000000011', name: 'Sainte-Thérèse de Grand-Dakar' },
    created_at: at(-3, '10:00:00'),
    updated_at: at(-2, '10:00:00'),
  },
];

export const priests = [
  {
    user_id: f5bIds.pretre,
    full_name: 'Emmanuel Tine',
    office: { code: 'vicaire_paroissial', label: 'Vicaire' },
    nodes: [{ id: ids.saintDominique, name: 'Saint-Dominique', type: 'paroisse' }],
    availability: { accepts_new_conversations: true, absent_until: null, reply_windows: [], note: '' },
  },
];

export const rosaryToday = {
  day: { id: 4, weekday: 3, weekday_display: 'Jeudi', group: { id: 2, name: 'Mystères lumineux', slug: 'lumineux', audio_file: '', mysteries: [] } },
  standalone_prayers: [],
};
