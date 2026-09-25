import { ids } from '@/testing/mocks/db';

/** Données de démonstration du site public (lot F4). */
export const f4Ids = {
  plateauMedina: 'd0000000-0000-4000-8000-000000000101',
  grandDakar: 'd0000000-0000-4000-8000-000000000102',
};

type Node = {
  id: string;
  name: string;
  code: string;
  type: { code: string; label: string };
  status: string;
  address: string;
  city: string;
  lat: string | null;
  lng: string | null;
  is_active_on_platform: boolean;
  parent_id: string | null;
  /** Ancêtres (pour le filtre de sous-arbre), absent de la réponse réelle. */
  within: string[];
};

const paroisse = { code: 'paroisse', label: 'Paroisse' };

const parish = (
  n: number,
  name: string,
  address: string,
  within: string[],
  extra: Partial<Node> = {},
): Node => ({
  id: `c0000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  name,
  code: `DAK-P${String(n).padStart(2, '0')}`,
  type: paroisse,
  status: 'erige',
  address,
  city: 'Dakar',
  lat: null,
  lng: null,
  is_active_on_platform: false,
  parent_id: within.at(-1) ?? null,
  within,
  ...extra,
});

const DAK_PM = [ids.dakar, f4Ids.plateauMedina];
const DAK_GD = [ids.dakar, f4Ids.grandDakar];

export const directoryNodes: Node[] = [
  {
    id: ids.dakar,
    name: 'Archidiocèse de Dakar',
    code: 'DAK',
    type: { code: 'diocese', label: 'Diocèse' },
    status: 'erige',
    address: '',
    city: 'Dakar',
    lat: null,
    lng: null,
    is_active_on_platform: true,
    parent_id: null,
    within: [],
  },
  {
    id: ids.thies,
    name: 'Diocèse de Thiès',
    code: 'THI',
    type: { code: 'diocese', label: 'Diocèse' },
    status: 'erige',
    address: '',
    city: 'Thiès',
    lat: null,
    lng: null,
    is_active_on_platform: false,
    parent_id: null,
    within: [],
  },
  { ...parish(101, 'Doyenné Plateau-Médina', '', [ids.dakar]), id: f4Ids.plateauMedina, code: 'DAK-D-PM', type: { code: 'doyenne', label: 'Doyenné' } },
  { ...parish(102, 'Doyenné Grand Dakar-Yoff', '', [ids.dakar]), id: f4Ids.grandDakar, code: 'DAK-D-GD', type: { code: 'doyenne', label: 'Doyenné' } },
  {
    ...parish(1, 'Paroisse Saint-Dominique', 'Avenue Cheikh Anta Diop, Point E', DAK_PM, {
      is_active_on_platform: true,
      lat: '14.693400',
      lng: '-17.462700',
    }),
    id: ids.saintDominique,
    code: 'DAK-SAINT-DOMINIQUE',
  },
  parish(2, 'Cathédrale Notre-Dame-des-Victoires', 'Boulevard de la République, Plateau', DAK_PM, { lat: '14.667000', lng: '-17.435000' }),
  parish(3, 'Saint-Joseph de Médina', 'Rue 11, Médina', DAK_PM),
  parish(4, 'Sainte-Thérèse de Grand-Dakar', 'Grand-Dakar', DAK_GD),
  parish(5, 'Notre-Dame des Anges de Ouakam', 'Ouakam', DAK_GD),
  parish(6, 'Saint-Pierre des Baobabs', 'Baobabs', DAK_GD),
  parish(7, 'Sacré-Cœur de Dakar', 'Sacré-Cœur 3', DAK_GD),
  parish(8, 'Saint-Paul de Grand-Yoff', 'Grand-Yoff', DAK_GD),
  parish(9, 'Marie-Immaculée des Parcelles', 'Parcelles Assainies', [ids.dakar]),
  parish(10, 'Saint-Charles-Lwanga de Guédiawaye', 'Guédiawaye', [ids.dakar]),
  parish(11, 'Notre-Dame du Liban', 'Fann', [ids.dakar]),
  parish(12, 'Cathédrale Sainte-Anne de Thiès', 'Centre-ville', [ids.thies], { city: 'Thiès' }),
];

/** Nœud tel que le renvoie l'API (sans le champ de test `within`). */
export const toApiNode = ({ within: _within, ...node }: Node) => node;

const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/** Jour liturgique simulé : dimanche vert, férie sinon ; lectures absentes après le 30 septembre. */
export const liturgyDayFor = (date: string) => {
  const d = new Date(`${date}T12:00:00Z`);
  const weekday = d.getUTCDay();
  const sunday = weekday === 0;
  const available = date <= '2026-09-30';
  return {
    date,
    calendar: {
      date,
      liturgical_year: 2026,
      season: 'ordinaire',
      season_label: 'Temps ordinaire',
      week: 25,
      celebration: sunday ? '26e dimanche du temps ordinaire' : `${WEEKDAYS[weekday]} de la 25e semaine du temps ordinaire`,
      rank: sunday ? 'dimanche' : 'ferie',
      color: 'vert',
      sunday_cycle: 'A',
      weekday_cycle: 'II',
    },
    source: 'crampon_refs',
    edition: { code: 'crampon', label: 'Bible Crampon (1923)' },
    notice: 'Références du jour ; texte de la Bible Crampon (1923), domaine public.',
    readings_available: available,
    readings: available
      ? [
          {
            type: 'lecture_1',
            citation: 'Ec 1, 2-11',
            text: null,
            verses: [
              { book: 'Ecclésiaste', chapter: 1, number: 2, text: 'Vanité des vanités, dit l’Ecclésiaste ; vanité des vanités, tout est vanité.' },
              { book: 'Ecclésiaste', chapter: 1, number: 4, text: 'Une génération s’en va, une autre vient, et la terre subsiste toujours.' },
            ],
          },
          {
            type: 'psaume',
            citation: 'Ps 89 (90)',
            text: null,
            verses: [{ book: 'Psaumes', chapter: 90, number: 12, text: 'Apprends-nous à bien compter nos jours.' }],
          },
          {
            type: 'evangile',
            citation: 'Lc 9, 7-9',
            text: '<p><sup>7</sup>Hérode le tétrarque entendit parler de tout ce qui se passait.</p><script>alert(1)</script>',
            verses: [],
          },
        ]
      : [],
    audio_url: null,
    meditation: null,
  };
};

export const nodeWeek = {
  node: { id: ids.saintDominique, name: 'Paroisse Saint-Dominique', code: 'DAK-SAINT-DOMINIQUE' },
  start: '2026-09-24',
  end: '2026-09-30',
  places: [
    { id: 1, node_id: ids.saintDominique, name: 'Église Saint-Dominique', kind: 'eglise_paroissiale', is_main: true, address: 'Avenue Cheikh Anta Diop', city: 'Dakar', lat: null, lng: null, is_active: true },
    { id: 2, node_id: ids.saintDominique, name: 'Chapelle de la Cité universitaire', kind: 'chapelle', is_main: false, address: '', city: 'Dakar', lat: null, lng: null, is_active: true },
  ],
  occurrences: [
    { date: '2026-09-26', kind: 'confession', start_time: '16:00:00', end_time: '18:00:00', place_id: 1, place_name: 'Église Saint-Dominique', language: 'fr', note: '', is_exception: false },
    { date: '2026-09-27', kind: 'messe', start_time: '09:30:00', end_time: null, place_id: 1, place_name: 'Église Saint-Dominique', language: 'fr', note: 'messe des étudiants', is_exception: false },
    { date: '2026-09-27', kind: 'messe', start_time: '07:30:00', end_time: null, place_id: 1, place_name: 'Église Saint-Dominique', language: 'fr', note: '', is_exception: false },
    { date: '2026-09-30', kind: 'messe', start_time: '19:15:00', end_time: null, place_id: 2, place_name: 'Chapelle de la Cité universitaire', language: 'fr', note: '', is_exception: true },
  ],
};

export const publicAnnouncements = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    content_type: 'announcement',
    title: 'Quête impérée pour le Grand Séminaire de Brin',
    slug: 'quete',
    excerpt: 'Le produit de la quête de ce dimanche est entièrement reversé au Grand Séminaire.',
    content_format: 'text',
    category: { id: 1, name: 'Quête', slug: 'quete', icon: '', color: '', display_order: 1 },
    author_name: 'Abbé Augustin Ndiaye',
    scope: { node_id: ids.saintDominique, node_name: 'Paroisse Saint-Dominique', place_id: null, place_name: null },
    is_sunday_notice: true,
    sunday_date: '2026-09-27',
    cover_image_url: null,
    published_at: '2026-09-22T09:00:00Z',
    reactions: { counts: {}, mine: [] },
  },
];

export const publicEvents = [
  {
    id: 1,
    title: 'Répétition de la chorale Sainte-Cécile',
    description: '',
    event_type: 'other',
    start_at: '2026-09-26T16:00:00Z',
    end_at: '2026-09-26T18:00:00Z',
    location: 'Salle paroissiale',
    node_id: ids.saintDominique,
    node_name: 'Paroisse Saint-Dominique',
    place_id: null,
    max_participants: null,
    registrations_count: 0,
    is_full: false,
    is_registered: false,
    is_cancelled: false,
  },
];

/** Dernière demande de contact reçue (assertions des tests). */
export const contactState: { last: Record<string, unknown> | null } = { last: null };
