import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

import { NOEUD_ARCHIDIOCESE, NOEUD_SAINT_DOMINIQUE } from './dons-analyse';

// Écrans staff « structure » branchés sur les routes V1 : hiérarchie (nœuds,
// lieux, semaine type, exceptions, réglages), offices et nominations,
// vérifications, confessions staff, audit et comptes plateforme. Exemples
// calqués sur les sérialiseurs du backend (apps/hierarchy, apps/confessions,
// apps/users) ; données fictives de l'archidiocèse de Dakar.

const API = env.API_URL;

const page = <T>(rows: T[], request: Request, defaut = 50) => {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? defaut);
  const offset = Number(url.searchParams.get('offset') ?? 0);
  return {
    count: rows.length,
    next:
      offset + limit < rows.length
        ? `${url.pathname}?offset=${offset + limit}`
        : null,
    previous:
      offset > 0
        ? `${url.pathname}?offset=${Math.max(0, offset - limit)}`
        : null,
    results: rows.slice(offset, offset + limit),
  };
};

const erreur = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message, details: {} } }, { status });

const DOYENNE = 'de000000-0000-4000-8000-0000000000d1';

const noeud = (
  id: string,
  code: string,
  label: string,
  name: string,
  depth: number,
  parent_id: string | null,
  has_children: boolean,
) => ({
  id,
  type: { code, label },
  name,
  code: '',
  status: 'erige',
  address: '',
  city: 'Dakar',
  erected_at: null,
  is_active_on_platform: true,
  depth,
  parent_id,
  has_children,
  located_in_id: null,
});

const NOEUDS = [
  noeud(
    NOEUD_ARCHIDIOCESE,
    'diocese',
    'Diocèse',
    'Archidiocèse de Dakar',
    0,
    null,
    true,
  ),
  noeud(
    DOYENNE,
    'doyenne',
    'Doyenné',
    'Doyenné Plateau-Médina',
    1,
    NOEUD_ARCHIDIOCESE,
    true,
  ),
  noeud(
    NOEUD_SAINT_DOMINIQUE,
    'paroisse',
    'Paroisse',
    'Saint-Dominique',
    2,
    DOYENNE,
    false,
  ),
];

const TYPES_NOEUD = [
  {
    code: 'diocese',
    label: 'Diocèse',
    is_territorial: true,
    holds_registers: false,
    order: 20,
    allowed_parent_types: ['province'],
  },
  {
    code: 'doyenne',
    label: 'Doyenné',
    is_territorial: true,
    holds_registers: false,
    order: 40,
    allowed_parent_types: ['diocese', 'zone'],
  },
  {
    code: 'paroisse',
    label: 'Paroisse',
    is_territorial: true,
    holds_registers: true,
    order: 50,
    allowed_parent_types: ['doyenne'],
  },
];

const TYPES_OFFICE = [
  {
    code: 'cure',
    label: 'Curé',
    node_types: ['paroisse'],
    required_order: 'pretre',
    cardinality: 'un',
    appointed_by: ['eveque'],
    appointed_by_platform: false,
    capabilities: [
      'actes.traiter',
      'annonces.publier',
      'horaires.gerer',
      'offices.nommer',
    ],
    inherits_down: false,
    qualities: [],
  },
  {
    code: 'secretaire_paroissial',
    label: 'Secrétaire paroissial',
    node_types: ['paroisse'],
    required_order: 'aucun',
    cardinality: 'plusieurs',
    appointed_by: ['cure'],
    appointed_by_platform: false,
    capabilities: ['actes.traiter', 'evenements.gerer'],
    inherits_down: false,
    qualities: [],
  },
];

const nominationsInitiales = () => [
  {
    id: 1,
    person: {
      id: 'p0000000-0000-4000-8000-000000000001',
      email: 'e.tine@example.sn',
      full_name: 'Emmanuel Tine',
    },
    office: 'cure',
    office_label: 'Curé',
    quality: '',
    node: {
      id: NOEUD_SAINT_DOMINIQUE,
      name: 'Saint-Dominique',
      code: '',
      type: 'paroisse',
    },
    start_date: '2024-09-01',
    end_date: null as string | null,
    status: 'active',
    decree_ref: 'DEC-2024-118',
    note: '',
    created_at: '2024-08-20T10:00:00+00:00',
  },
  {
    id: 2,
    person: {
      id: 'p0000000-0000-4000-8000-000000000002',
      email: 'c.coly@example.sn',
      full_name: 'Cécile Coly',
    },
    office: 'secretaire_paroissial',
    office_label: 'Secrétaire paroissial',
    quality: '',
    node: {
      id: NOEUD_SAINT_DOMINIQUE,
      name: 'Saint-Dominique',
      code: '',
      type: 'paroisse',
    },
    start_date: '2025-01-06',
    end_date: null as string | null,
    status: 'active',
    decree_ref: '',
    note: '',
    created_at: '2025-01-06T10:00:00+00:00',
  },
];

let nominations = nominationsInitiales();

const LIEUX = [
  {
    id: 1,
    node_id: NOEUD_SAINT_DOMINIQUE,
    name: 'Église Saint-Dominique',
    kind: 'eglise_paroissiale',
    is_main: true,
    address: 'Point E',
    city: 'Dakar',
    lat: null,
    lng: null,
    is_active: true,
  },
];

let horaires: Record<string, unknown>[] = [
  {
    id: 1,
    kind: 'messe',
    weekday: 6,
    start_time: '08:00:00',
    end_time: null,
    language: 'fr',
    note: '',
    valid_from: null,
    valid_to: null,
  },
  {
    id: 2,
    kind: 'messe',
    weekday: 6,
    start_time: '10:00:00',
    end_time: null,
    language: 'fr',
    note: '',
    valid_from: null,
    valid_to: null,
  },
  {
    id: 3,
    kind: 'messe',
    weekday: 5,
    start_time: '18:30:00',
    end_time: null,
    language: 'fr',
    note: 'Messe anticipée',
    valid_from: null,
    valid_to: null,
  },
];

let reglages = {
  id: NOEUD_SAINT_DOMINIQUE,
  address: 'Point E',
  city: 'Dakar',
  phone: '+221 33 800 00 00',
  email: 'secretariat@saint-dominique.example.sn',
  office_hours: [{ days: 'Lundi–vendredi', hours: '9 h – 12 h, 15 h – 18 h' }],
  secretariat_public: true,
  acts_delay_days: 7,
  acts_welcome_message: '',
  updated_at: '2026-09-01T08:00:00+00:00',
};

const declarations = [
  {
    id: 'p0000000-0000-4000-8000-000000000003',
    email: 'f.sarr@example.sn',
    full_name: 'Frère Paul Sarr',
    etat_de_vie: 'consacre',
    degre_ordre: 'aucun',
    statut_verification: 'declare',
    verification_note: '',
    declared_at: '2026-09-24T16:00:00+00:00',
    incardination_node: null,
    institut_node: null,
    attachments: [],
  },
];

const comptes = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    email: 'marie-therese.diouf@example.sn',
    full_name: 'Marie-Thérèse Diouf',
    realm_role: 'fidele',
    mfa: 'facultative',
    last_login: '2026-09-27T08:40:00+00:00',
    status: 'actif',
    node_label: 'Saint-Dominique',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    email: 'c.coly@example.sn',
    full_name: 'Cécile Coly',
    realm_role: 'staff',
    mfa: 'active',
    last_login: '2026-09-27T11:02:00+00:00',
    status: 'actif',
    node_label: 'Saint-Dominique',
  },
];

export const resetStaffStructureMocks = () => {
  nominations = nominationsInitiales();
};

export const staffStructureHandlers = [
  // Hiérarchie
  http.get(`${API}/v1/hierarchy/node-types/`, () =>
    HttpResponse.json(TYPES_NOEUD),
  ),
  http.get(`${API}/v1/hierarchy/nodes/`, ({ request }) => {
    const q = new URL(request.url).searchParams.get('q')?.toLowerCase();
    return HttpResponse.json(
      page(
        NOEUDS.filter((n) => !q || n.name.toLowerCase().includes(q)),
        request,
      ),
    );
  }),
  http.get(`${API}/v1/hierarchy/nodes/:id/children/`, ({ params }) =>
    HttpResponse.json(NOEUDS.filter((n) => n.parent_id === params.id)),
  ),
  http.get(`${API}/v1/hierarchy/nodes/:id/ancestors/`, ({ params }) => {
    const chaine = [];
    let courant = NOEUDS.find((n) => n.id === params.id)?.parent_id;
    while (courant) {
      const n = NOEUDS.find((x) => x.id === courant);
      if (!n) break;
      chaine.unshift(n);
      courant = n.parent_id;
    }
    return HttpResponse.json(chaine);
  }),
  http.get(`${API}/v1/hierarchy/nodes/:id/places/`, ({ params }) =>
    HttpResponse.json(LIEUX.filter((l) => l.node_id === params.id)),
  ),
  http.get(`${API}/v1/hierarchy/nodes/:id/settings/`, () =>
    HttpResponse.json(reglages),
  ),
  http.patch(`${API}/v1/hierarchy/nodes/:id/settings/`, async ({ request }) => {
    reglages = { ...reglages, ...((await request.json()) as object) };
    return HttpResponse.json(reglages);
  }),
  http.get(`${API}/v1/hierarchy/nodes/:id/`, ({ params }) => {
    const n = NOEUDS.find((x) => x.id === params.id);
    return n
      ? HttpResponse.json(n)
      : erreur(404, 'not_found', 'Nœud introuvable.');
  }),
  http.get(`${API}/v1/hierarchy/places/:id/schedule/`, () =>
    HttpResponse.json(horaires),
  ),
  http.put(`${API}/v1/hierarchy/places/:id/schedule/`, async ({ request }) => {
    const { items } = (await request.json()) as {
      items: Record<string, unknown>[];
    };
    horaires = items.map((h, i) => ({ ...h, id: i + 1 }));
    return HttpResponse.json(horaires);
  }),
  http.get(`${API}/v1/hierarchy/places/:id/exceptions/`, () =>
    HttpResponse.json([]),
  ),

  // Offices et nominations
  http.get(`${API}/v1/hierarchy/office-types/`, () =>
    HttpResponse.json(TYPES_OFFICE),
  ),
  http.get(`${API}/v1/hierarchy/persons/`, ({ request }) =>
    HttpResponse.json(
      page(
        [
          {
            id: 'p0000000-0000-4000-8000-000000000004',
            full_name: 'Awa Faye',
            email_masked: 'a***@example.sn',
            etat_de_vie: 'laic',
            degre_ordre: 'aucun',
            statut_verification: 'non_requis',
          },
        ],
        request,
        10,
      ),
    ),
  ),
  http.get(`${API}/v1/hierarchy/assignments/`, ({ request }) => {
    const statut = new URL(request.url).searchParams.get('status');
    return HttpResponse.json(
      page(
        nominations.filter((a) => !statut || a.status === statut),
        request,
      ),
    );
  }),
  http.patch(
    `${API}/v1/hierarchy/assignments/:id/`,
    async ({ params, request }) => {
      const a = nominations.find((x) => x.id === Number(params.id));
      if (!a) return erreur(404, 'not_found', 'Nomination introuvable.');
      const { action } = (await request.json()) as { action: string };
      a.status = action === 'terminer' ? 'terminee' : 'annulee';
      a.end_date = '2026-09-27';
      return HttpResponse.json(a);
    },
  ),

  // Vérifications des statuts déclarés
  http.get(`${API}/v1/hierarchy/verifications/`, ({ request }) =>
    HttpResponse.json(page(declarations, request, 20)),
  ),

  // Confessions (staff)
  http.get(`${API}/v1/staff/confessions/rules/`, () => HttpResponse.json([])),
  http.get(`${API}/v1/staff/confessions/planning/`, () =>
    HttpResponse.json([]),
  ),

  // Délais des actes, disponibilités de messagerie
  http.get(`${API}/v1/staff/documents/nodes/:id/type-delays/`, ({ params }) =>
    HttpResponse.json({
      node_id: params.id,
      default_days: 7,
      items: [
        {
          document_type: 'baptism',
          document_type_label: 'Certificat de baptême',
          days: null,
        },
      ],
    }),
  ),
  http.get(`${API}/v1/messaging/availability/`, () =>
    HttpResponse.json({
      accepts_new_conversations: true,
      absent_until: null,
      reply_windows: [],
      note: '',
    }),
  ),

  // Audit et comptes plateforme
  http.get(`${API}/v1/audit/`, ({ request }) =>
    HttpResponse.json(
      page(
        [
          {
            id: 1,
            at: '2026-09-27T11:05:00+00:00',
            actor_id: 'a0000000-0000-4000-8000-000000000002',
            actor_name: 'Cécile Coly',
            action: 'dons.quete_saisie',
            target_type: 'donations.cashcollection',
            target_id: '41',
            node_id: NOEUD_SAINT_DOMINIQUE,
            metadata: {},
            ip: '196.207.0.0',
          },
        ],
        request,
      ),
    ),
  ),
  http.get(`${API}/v1/platform/accounts/`, ({ request }) =>
    HttpResponse.json(page(comptes, request, 25)),
  ),
];
