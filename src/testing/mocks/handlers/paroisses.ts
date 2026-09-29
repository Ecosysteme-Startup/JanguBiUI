import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

// Paroisses multiples (décisions 6-8) — données fictives des maquettes
// maquettes-v2-paroisses (ECRANS-V2-PAROISSES §3). Contrat :
// jangubi/docs/API-AUDIO.md §9.
//
// Marie-Thérèse Diouf : principale Saint-Dominique (3 septembre 2026),
// secondaires Cathédrale Notre-Dame-des-Victoires (8 septembre) et
// Saint-Pierre des Baobabs (14 septembre). Paroisse à ajouter : Saint-Joseph
// de Médina (sa chorale publie la « Messe de la Saint-Joseph 2026 »,
// réservée à ses paroissiens).

const API = env.API_URL;

type Noeud = {
  id: string;
  name: string;
  code: string;
  city: string;
  deanery_name: string;
};

export const PAROISSES = {
  saintDominique: {
    id: '5b7d2c1e-8a41-4f0b-9d7e-2c3f1a6b9e01',
    name: 'Saint-Dominique',
    code: 'DAK-P-SAINT-DOMINIQUE',
    city: 'Point E',
    deanery_name: 'Plateau-Médina',
  },
  cathedrale: {
    id: '5b7d2c1e-8a41-4f0b-9d7e-2c3f1a6b9e03',
    name: 'Cathédrale Notre-Dame-des-Victoires',
    code: 'DAK-P-CATHEDRALE',
    city: 'Plateau',
    deanery_name: 'Plateau-Médina',
  },
  saintPierre: {
    id: '5b7d2c1e-8a41-4f0b-9d7e-2c3f1a6b9e04',
    name: 'Saint-Pierre des Baobabs',
    code: 'DAK-P-SAINT-PIERRE-BAOBABS',
    city: 'Sacré-Cœur',
    deanery_name: 'Grand Dakar-Yoff',
  },
  medina: {
    id: '5b7d2c1e-8a41-4f0b-9d7e-2c3f1a6b9e02',
    name: 'Saint-Joseph de Médina',
    code: 'DAK-P-SAINT-JOSEPH-MEDINA',
    city: 'Médina',
    deanery_name: 'Plateau-Médina',
  },
  sainteTherese: {
    id: '5b7d2c1e-8a41-4f0b-9d7e-2c3f1a6b9e05',
    name: 'Sainte-Thérèse de Grand-Dakar',
    code: 'DAK-P-SAINTE-THERESE',
    city: 'Grand-Dakar',
    deanery_name: 'Grand Dakar-Yoff',
  },
} satisfies Record<string, Noeud>;

const ANNUAIRE: Noeud[] = Object.values(PAROISSES).sort((a, b) =>
  a.name.localeCompare(b.name, 'fr'),
);

type Adhesion = { id: string; principale: boolean; membre_depuis: string };

const INITIALES: Adhesion[] = [
  {
    id: PAROISSES.saintDominique.id,
    principale: true,
    membre_depuis: '2026-09-03T09:00:00Z',
  },
  {
    id: PAROISSES.cathedrale.id,
    principale: false,
    membre_depuis: '2026-09-08T10:00:00Z',
  },
  {
    id: PAROISSES.saintPierre.id,
    principale: false,
    membre_depuis: '2026-09-14T10:00:00Z',
  },
];

let adhesions: Adhesion[] = INITIALES.map((a) => ({ ...a }));
/** Paroisses qui ont retiré la personne : réinscription seule refusée. */
const retireePar = new Set<string>();

/** La personne est-elle membre de cette paroisse (principale ou secondaire) ? */
export const estMembreDe = (paroisseId: string) =>
  adhesions.some((a) => a.id === paroisseId);

const noeud = (id: string) => ANNUAIRE.find((n) => n.id === id);

const mesParoissesJson = () =>
  [...adhesions]
    .sort(
      (a, b) =>
        Number(b.principale) - Number(a.principale) ||
        a.membre_depuis.localeCompare(b.membre_depuis),
    )
    .map((a) => {
      const n = noeud(a.id)!;
      return {
        paroisse: {
          id: n.id,
          name: n.name,
          code: n.code,
          type: 'paroisse',
          city: n.city,
          deanery_name: n.deanery_name,
        },
        principale: a.principale,
        membre_depuis: a.membre_depuis,
      };
    });

const erreur = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message, details: {} } }, { status });

// ------------------------------------------------------ membres (staff)

type Membre = {
  user_id: string;
  first_name: string;
  last_name: string;
  principale: boolean;
  membre_depuis: string;
  retire_le: string | null;
};

const MEMBRES_INITIAUX: Membre[] = [
  ['Marie-Thérèse', 'Diouf', true, '2026-09-03T09:00:00Z'],
  ['Awa', 'Faye', true, '2026-06-12T10:00:00Z'],
  ['Paul', 'Diatta', true, '2026-05-02T10:00:00Z'],
  ['Joseph', 'Mendy', false, '2026-09-10T10:00:00Z'],
  ['Élisabeth', 'Gomis', true, '2026-01-18T10:00:00Z'],
  ['Michel', 'Badji', true, '2026-02-21T10:00:00Z'],
  ['Fatou', 'Sarr', false, '2026-09-21T10:00:00Z'],
].map(([first_name, last_name, principale, membre_depuis], i) => ({
  user_id: `0c7b0000-0000-4000-8000-${(i + 1).toString().padStart(12, '0')}`,
  first_name: first_name as string,
  last_name: last_name as string,
  principale: principale as boolean,
  membre_depuis: membre_depuis as string,
  retire_le: null,
}));

const RETIRE_INITIAL: Membre = {
  user_id: '0c7b0000-0000-4000-8000-000000000099',
  first_name: 'Ibrahima',
  last_name: 'Ndour',
  principale: false,
  membre_depuis: '2026-04-04T10:00:00Z',
  retire_le: '2026-09-15T16:20:00Z',
};

let membres: Membre[] = [
  ...MEMBRES_INITIAUX.map((m) => ({ ...m })),
  { ...RETIRE_INITIAL },
];

// ------------------------------------------ annonces des autres paroisses

const annonce = (
  id: string,
  paroisse: Noeud,
  title: string,
  excerpt: string,
  category: string,
  published_at: string,
) => ({
  id,
  content_type: 'announcement',
  title,
  slug: id,
  excerpt,
  content_format: 'markdown',
  category: { id: 1, name: category, slug: category.toLowerCase() },
  author_name: `Secrétariat de ${paroisse.name}`,
  scope: {
    node_id: paroisse.id,
    node_name: paroisse.name,
    place_id: null,
    place_name: null,
  },
  is_sunday_notice: false,
  sunday_date: null,
  cover_image_url: null,
  cover_image_alt: '',
  cover_image_decorative: true,
  published_at,
  reactions: { counts: {}, mine: [] },
});

export const ANNONCES_AUTRES_PAROISSES = [
  annonce(
    '6a000000-0000-4000-8000-000000000001',
    PAROISSES.cathedrale,
    'Ouverture du mois du Rosaire',
    'Chapelet chaque soir à 18 h 30 devant la grotte, du 1er au 31 octobre.',
    'Liturgie',
    '2026-09-25T17:00:00Z',
  ),
  annonce(
    '6a000000-0000-4000-8000-000000000002',
    PAROISSES.saintPierre,
    'Kermesse paroissiale',
    'Samedi 10 octobre, de 10 h à 18 h, dans la cour de la paroisse. Stands, jeux et repas.',
    'Vie paroissiale',
    '2026-09-24T12:00:00Z',
  ),
  annonce(
    '6a000000-0000-4000-8000-000000000003',
    PAROISSES.cathedrale,
    'Reprise de la catéchèse des adultes',
    'Chaque mardi à 19 h, salle Saint-Jean. Inscriptions au secrétariat.',
    'Catéchèse',
    '2026-09-22T09:00:00Z',
  ),
  annonce(
    '6a000000-0000-4000-8000-000000000004',
    PAROISSES.saintPierre,
    'La chorale des jeunes recrute',
    'Répétitions le vendredi à 18 h. Toutes les voix sont les bienvenues.',
    'Jeunes',
    '2026-09-20T18:00:00Z',
  ),
];

// ------------------------------------------------ fil « Ma paroisse »

const ARCHIDIOCESE = {
  id: 'da000000-0000-4000-8000-00000000000a',
  name: 'Archidiocèse de Dakar',
};

/** Contenus hors paroisse : diocèse (`node`) ou globaux (`node: null`). */
const contenu = (
  id: string,
  node: { id: string; name: string } | null,
  content_type: string,
  title: string,
  excerpt: string,
  category: string,
  author_name: string,
  published_at: string,
) => ({
  ...annonce(
    id,
    PAROISSES.saintDominique,
    title,
    excerpt,
    category,
    published_at,
  ),
  content_type,
  author_name,
  scope: {
    node_id: node?.id ?? null,
    node_name: node?.name ?? null,
    place_id: null,
    place_name: null,
  },
});

/** Annonces des paroisses (fil principal de celle qui est principale). */
export const ANNONCES_PAROISSES = [
  annonce(
    '6b000000-0000-4000-8000-000000000001',
    PAROISSES.saintDominique,
    'Messe des familles dimanche 4 octobre',
    'Messe de 10 h 30 animée par les enfants du catéchisme, suivie d’un apéritif dans la cour.',
    'Vie paroissiale',
    '2026-09-26T18:00:00Z',
  ),
  annonce(
    '6b000000-0000-4000-8000-000000000002',
    PAROISSES.saintDominique,
    'Inscriptions au catéchisme',
    'Les inscriptions sont ouvertes au secrétariat du mardi au samedi, de 9 h à 12 h.',
    'Catéchèse',
    '2026-09-23T09:00:00Z',
  ),
];

/** Contenus du diocèse et de l'Église universelle (fil principal de tous). */
export const CONTENUS_GENERAUX = [
  contenu(
    '6c000000-0000-4000-8000-000000000001',
    ARCHIDIOCESE,
    'pastoral_letter',
    'Lettre pastorale pour la rentrée',
    'L’archevêque de Dakar invite chaque communauté à prendre soin des plus fragiles.',
    'Diocèse',
    'Archidiocèse de Dakar',
    '2026-09-24T08:00:00Z',
  ),
  contenu(
    '6c000000-0000-4000-8000-000000000002',
    null,
    'article',
    'Journée mondiale du migrant et du réfugié',
    'Dimanche 27 septembre, l’Église prie pour les personnes contraintes de quitter leur pays.',
    'Église universelle',
    'Rédaction Jàngu Bi',
    '2026-09-21T07:00:00Z',
  ),
];

/** Remet l'état du serveur de mocks à zéro (tests). */
export function resetParoissesMocks() {
  adhesions = INITIALES.map((a) => ({ ...a }));
  retireePar.clear();
  membres = [...MEMBRES_INITIAUX.map((m) => ({ ...m })), { ...RETIRE_INITIAL }];
}

const pagine = <T>(request: Request, liste: T[]) => {
  const q = new URL(request.url).searchParams;
  const limit = Math.max(1, Number(q.get('limit') ?? 20) || 20);
  const offset = Math.max(0, Number(q.get('offset') ?? 0) || 0);
  return {
    limit,
    offset,
    count: liste.length,
    next: offset + limit < liste.length ? `?offset=${offset + limit}` : null,
    previous: offset > 0 ? `?offset=${Math.max(0, offset - limit)}` : null,
    results: liste.slice(offset, offset + limit),
  };
};

const sansAccents = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const paroissesHandlers = [
  // ------------------------------------------------ mes paroisses
  http.get(`${API}/me/paroisses/`, async () => {
    return HttpResponse.json(mesParoissesJson());
  }),

  http.post(`${API}/me/paroisses/`, async ({ request }) => {
    const body = (await request.json()) as {
      paroisse_id: string;
      principale?: boolean;
    };
    if (!noeud(body.paroisse_id))
      return erreur(400, 'not_a_parish', 'Ce nœud n’est pas une paroisse.');
    if (retireePar.has(body.paroisse_id))
      return erreur(
        403,
        'retire_par_la_paroisse',
        'Cette paroisse vous a retiré de ses membres.',
      );
    const premiere = adhesions.length === 0;
    if (!estMembreDe(body.paroisse_id)) {
      adhesions.push({
        id: body.paroisse_id,
        principale: false,
        membre_depuis: new Date().toISOString(),
      });
    }
    if (premiere || body.principale) {
      adhesions = adhesions.map((a) => ({
        ...a,
        principale: a.id === body.paroisse_id,
      }));
    }
    return HttpResponse.json(mesParoissesJson(), { status: 201 });
  }),

  http.delete(`${API}/me/paroisses/:id/`, async ({ params }) => {
    const id = String(params.id);
    const a = adhesions.find((x) => x.id === id);
    if (!a) return erreur(404, 'membre_introuvable', 'Vous n’êtes pas membre.');
    adhesions = adhesions.filter((x) => x.id !== id);
    if (a.principale && adhesions.length) {
      const plusAncienne = [...adhesions].sort((x, y) =>
        x.membre_depuis.localeCompare(y.membre_depuis),
      )[0];
      plusAncienne.principale = true;
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.put(`${API}/me/paroisses/:id/principale/`, async ({ params }) => {
    const id = String(params.id);
    if (!estMembreDe(id))
      return erreur(404, 'membre_introuvable', 'Vous n’êtes pas membre.');
    adhesions = adhesions.map((a) => ({ ...a, principale: a.id === id }));
    return HttpResponse.json(mesParoissesJson());
  }),
];
