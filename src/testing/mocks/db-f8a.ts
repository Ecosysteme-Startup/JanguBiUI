import { ids } from '@/testing/mocks/db';

/** Données démo du lot F8a (back-office paroisse), reprises des maquettes PAR-*. */

const scope = { node_id: ids.saintDominique, node_name: 'Saint-Dominique', place_id: null, place_name: null };

export const f8aCategories = [
  { id: 1, name: 'Vie paroissiale', slug: 'vie-paroissiale', icon: '', color: '', display_order: 1 },
  { id: 2, name: 'Liturgie', slug: 'liturgie', icon: '', color: '', display_order: 2 },
];

type Article = Record<string, unknown> & { id: string; status: string; title: string };

const article = (overrides: Partial<Article> & { id: string; title: string; status: string }): Article => ({
  content_type: 'announcement',
  slug: overrides.id,
  excerpt: '',
  content: '<p>Chers frères et sœurs.</p>',
  content_format: 'html',
  category: { ...f8aCategories[0] },
  author_name: 'Abbé Augustin Ndiaye',
  scope,
  is_sunday_notice: false,
  sunday_date: null,
  publish_at: null,
  published_at: null,
  unpublished_at: null,
  unpublish_reason: '',
  reads_count: 0,
  created_at: '2026-09-20T09:00:00+00:00',
  updated_at: '2026-09-22T09:40:00+00:00',
  ...overrides,
});

const initialArticles = (): Article[] => [
  article({
    id: 'a0000000-0000-4000-8000-000000000001',
    title: 'Quête impérée pour le Grand Séminaire de Brin',
    status: 'draft',
    is_sunday_notice: true,
    sunday_date: '2026-09-27',
  }),
  article({
    id: 'a0000000-0000-4000-8000-000000000002',
    title: 'Messe d’action de grâce pour la rentrée universitaire',
    status: 'scheduled',
    publish_at: '2026-09-27T06:00:00+00:00',
    author_name: 'Père Emmanuel Tine',
  }),
  article({
    id: 'a0000000-0000-4000-8000-000000000003',
    title: 'Répétition de la chorale Sainte-Cécile, samedi 16 h',
    status: 'published',
    published_at: '2026-09-23T18:05:00+00:00',
    reads_count: 345,
    author_name: 'Mme Germaine Faye',
  }),
];

export const places = [
  { id: 11, node_id: ids.saintDominique, name: 'Église Saint-Dominique', kind: 'eglise_paroissiale', is_main: true, address: 'Point E', city: 'Dakar', lat: null, lng: null, is_active: true },
  { id: 12, node_id: ids.saintDominique, name: 'Chapelle de la Cité universitaire', kind: 'chapelle', is_main: false, address: 'Campus social de l’UCAD', city: 'Dakar', lat: null, lng: null, is_active: true },
];

type Schedule = { id: number; kind: string; weekday: number; start_time: string; end_time: string | null; language: string; note: string; valid_from: string | null; valid_to: string | null };

const sched = (id: number, weekday: number, start_time: string, extra: Partial<Schedule> = {}): Schedule => ({
  id,
  kind: 'messe',
  weekday,
  start_time,
  end_time: null,
  language: 'fr',
  note: '',
  valid_from: null,
  valid_to: null,
  ...extra,
});

const initialSchedules = (): Record<number, Schedule[]> => ({
  11: [sched(1, 0, '07:00:00'), sched(2, 5, '16:00:00', { kind: 'confession', end_time: '18:00:00' }), sched(3, 6, '09:30:00', { note: 'Étudiants' })],
  12: [sched(4, 2, '20:30:00', { kind: 'adoration', end_time: '21:30:00' })],
});

const initialExceptions = (): Record<number, Record<string, unknown>[]> => ({
  11: [{ id: 21, date: '2099-10-01', kind: 'messe', cancelled: true, start_time: '07:00:00', end_time: null, note: 'Récollection du clergé' }],
  12: [],
});

type Event = Record<string, unknown> & { id: number; title: string; start_at: string; end_at: string };

const initialEvents = (): Event[] => [
  {
    id: 31,
    title: 'Journée de récollection des CEB',
    description: 'Animée par l’Abbé Robert Sagna.',
    event_type: 'retreat',
    start_at: '2026-10-10T08:30:00',
    end_at: '2026-10-10T16:00:00',
    location: 'Salle paroissiale',
    node_id: ids.saintDominique,
    node_name: 'Saint-Dominique',
    place_id: 11,
    max_participants: 60,
    registrations_count: 2,
    is_full: false,
    is_registered: false,
    is_cancelled: false,
  },
  {
    id: 32,
    title: 'Rentrée du catéchisme',
    description: '',
    event_type: 'other',
    start_at: '2026-10-12T17:00:00',
    end_at: '2026-10-12T18:30:00',
    location: 'Cour de la paroisse',
    node_id: ids.saintDominique,
    node_name: 'Saint-Dominique',
    place_id: null,
    max_participants: null,
    registrations_count: 0,
    is_full: false,
    is_registered: false,
    is_cancelled: false,
  },
];

export const registrations = [
  { id: 1, user_id: 'u1', full_name: 'Thérèse Ndione', email: 'therese@example.sn', registered_at: '2026-09-23T10:00:00+00:00' },
  { id: 2, user_id: 'u2', full_name: 'Albert Senghor', email: 'albert@example.sn', registered_at: '2026-09-23T11:00:00+00:00' },
];

export const officeCatalogue = [
  {
    code: 'cure',
    label: 'Curé',
    node_types: ['paroisse'],
    required_order: 'pretre',
    cardinality: 'un',
    appointed_by: ['eveque'],
    appointed_by_platform: false,
    capabilities: ['actes.traiter', 'offices.nommer', 'messagerie.recevoir_fideles', 'confessions.gerer', 'tableau_bord.voir'],
    inherits_down: true,
  },
  {
    code: 'catechiste',
    label: 'Catéchiste',
    node_types: ['paroisse', 'ceb'],
    required_order: 'aucun',
    cardinality: 'plusieurs',
    appointed_by: ['cure'],
    appointed_by_platform: false,
    capabilities: ['evenements.gerer', 'annonces.publier'],
    inherits_down: false,
  },
  {
    code: 'secretaire_paroissial',
    label: 'Secrétaire paroissiale',
    node_types: ['paroisse'],
    required_order: 'aucun',
    cardinality: 'plusieurs',
    appointed_by: ['cure'],
    appointed_by_platform: false,
    capabilities: ['annonces.publier', 'horaires.gerer', 'actes.traiter'],
    inherits_down: true,
  },
];

const person = (id: string, full_name: string) => ({ id, email: `${id}@example.sn`, full_name });
const sdRef = { id: ids.saintDominique, name: 'Saint-Dominique', code: 'SD', type: 'paroisse' };

type MockAssignment = {
  id: number;
  person: { id: string; email: string; full_name: string };
  office: string;
  office_label: string;
  node: typeof sdRef;
  start_date: string;
  end_date: string | null;
  status: string;
  appointed_by_id: string | null;
  decree_ref: string;
  note: string;
  created_at: string;
};

const initialAssignments = (): MockAssignment[] => [
  {
    id: 41,
    person: person('p-ndiaye', 'Abbé Augustin Ndiaye'),
    office: 'cure',
    office_label: 'Curé',
    node: sdRef,
    start_date: '2021-09-01',
    end_date: null,
    status: 'active',
    appointed_by_id: null,
    decree_ref: 'Décret 2021-114',
    note: '',
    created_at: '2021-08-20T09:00:00+00:00',
  },
  {
    id: 42,
    person: person('p-faye', 'Mme Germaine Faye'),
    office: 'secretaire_paroissial',
    office_label: 'Secrétaire paroissiale',
    node: sdRef,
    start_date: '2019-01-03',
    end_date: null,
    status: 'active',
    appointed_by_id: 'p-ndiaye',
    decree_ref: '',
    note: '',
    created_at: '2019-01-02T09:00:00+00:00',
  },
  {
    id: 43,
    person: person('p-sarr', 'Anna Sarr'),
    office: 'catechiste',
    office_label: 'Catéchiste',
    node: sdRef,
    start_date: '2023-10-01',
    end_date: '2025-06-30',
    status: 'terminee',
    appointed_by_id: 'p-ndiaye',
    decree_ref: '',
    note: 'À sa demande',
    created_at: '2023-09-20T09:00:00+00:00',
  },
];

export const nodeDetail = {
  id: ids.saintDominique,
  type: { code: 'paroisse', label: 'Paroisse' },
  name: 'Saint-Dominique',
  code: 'SD',
  status: 'erige',
  address: 'Rue de Fatick, Point E',
  city: 'Dakar',
  lat: null,
  lng: null,
  erected_at: '1956-10-07',
  is_active_on_platform: true,
  located_in_id: null,
  depth: 3,
  parent_id: ids.dakar,
  has_children: true,
};

/** Paramètres du secrétariat (`GET/PATCH /hierarchy/nodes/{id}/settings/`). */
export const nodeSettingsDetail = {
  id: ids.saintDominique,
  address: 'Rue de Fatick, Point E',
  city: 'Dakar',
  phone: '+221 33 825 40 18',
  email: 'secretariat@saint-dominique.sn',
  office_hours: [
    { days: 'Lun. – ven.', hours: '9 h-12 h · 15 h 30-18 h' },
    { days: 'Samedi', hours: '9 h-12 h' },
  ],
  secretariat_public: true,
  acts_delay_days: 3 as number | null,
  acts_welcome_message: 'Munissez-vous d’une pièce d’identité.',
  updated_at: '2026-09-18T10:00:00Z',
};

export const nodeChildren = [
  { ...nodeDetail, id: 'c0000000-0000-4000-8000-000000000001', type: { code: 'ceb', label: 'CEB' }, name: 'CEB Saint-Charles-Lwanga', code: 'SD-CEB1', address: '', city: 'Point E', has_children: false, parent_id: ids.saintDominique, depth: 4, erected_at: null },
];

/** État mutable des handlers F8a, remis à zéro par `resetF8a()` avant chaque test. */
export const f8aState = {
  articles: initialArticles(),
  schedules: initialSchedules(),
  exceptions: initialExceptions(),
  events: initialEvents(),
  assignments: initialAssignments(),
  node: { ...nodeDetail },
  settings: { ...nodeSettingsDetail },
  lastBody: null as unknown,
};

export const resetF8a = () => {
  f8aState.articles = initialArticles();
  f8aState.schedules = initialSchedules();
  f8aState.exceptions = initialExceptions();
  f8aState.events = initialEvents();
  f8aState.assignments = initialAssignments();
  f8aState.node = { ...nodeDetail };
  f8aState.settings = { ...nodeSettingsDetail };
  f8aState.lastBody = null;
};
