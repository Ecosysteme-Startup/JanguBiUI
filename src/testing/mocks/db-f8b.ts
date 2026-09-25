import { ids } from '@/testing/mocks/db';

/** Données de démonstration du lot F8b (tableaux de bord, gouvernance, plateforme). */
export const f8bIds = {
  province: '0b7b1f0e-0000-4000-8000-000000000010',
  plateauMedina: '0b7b1f0e-0000-4000-8000-000000000020',
  grandDakar: '0b7b1f0e-0000-4000-8000-000000000021',
  cathedrale: '0b7b1f0e-0000-4000-8000-000000000030',
  saintJoseph: '0b7b1f0e-0000-4000-8000-000000000031',
  sainteTherese: '0b7b1f0e-0000-4000-8000-000000000032',
  cebBakhita: '0b7b1f0e-0000-4000-8000-000000000040',
  prePersonne: '5f0c0000-0000-4000-8000-0000000000b1',
  accountFaye: '5f0c0000-0000-4000-8000-0000000000c1',
  accountNdour: '5f0c0000-0000-4000-8000-0000000000c2',
};

type NodeRow = {
  id: string;
  type: { code: string; label: string };
  name: string;
  code: string;
  status: 'en_fondation' | 'erige' | 'supprime';
  address: string;
  city: string;
  lat: string | null;
  lng: string | null;
  erected_at: string | null;
  is_active_on_platform: boolean;
  located_in_id: string | null;
  depth: number;
  parent_id: string | null;
  has_children: boolean;
};

const T = {
  province: { code: 'province', label: 'Province ecclésiastique' },
  diocese: { code: 'diocese', label: 'Diocèse' },
  doyenne: { code: 'doyenne', label: 'Doyenné' },
  paroisse: { code: 'paroisse', label: 'Paroisse' },
  ceb: { code: 'ceb', label: 'Communauté ecclésiale de base' },
};

const node = (row: Partial<NodeRow> & Pick<NodeRow, 'id' | 'type' | 'name' | 'code' | 'depth' | 'parent_id'>): NodeRow => ({
  status: 'erige',
  address: '',
  city: 'Dakar',
  lat: null,
  lng: null,
  erected_at: null,
  is_active_on_platform: false,
  located_in_id: null,
  has_children: false,
  ...row,
});

export const initialNodes = (): NodeRow[] => [
  node({ id: f8bIds.province, type: T.province, name: 'Province de Dakar', code: 'DAKP', depth: 1, parent_id: null, has_children: true }),
  node({
    id: ids.dakar,
    type: T.diocese,
    name: 'Archidiocèse de Dakar',
    code: 'DAK',
    depth: 2,
    parent_id: f8bIds.province,
    has_children: true,
  }),
  node({
    id: f8bIds.plateauMedina,
    type: T.doyenne,
    name: 'Doyenné Plateau-Médina',
    code: 'DAK-D-PM',
    depth: 3,
    parent_id: ids.dakar,
    has_children: true,
  }),
  node({
    id: f8bIds.grandDakar,
    type: T.doyenne,
    name: 'Doyenné Grand Dakar-Yoff',
    code: 'DAK-D-GDY',
    depth: 3,
    parent_id: ids.dakar,
    has_children: true,
  }),
  node({
    id: ids.saintDominique,
    type: T.paroisse,
    name: 'Saint-Dominique',
    code: 'PAR-DKR-PM-014',
    depth: 4,
    parent_id: f8bIds.plateauMedina,
    is_active_on_platform: true,
    address: 'Point E',
    has_children: true,
  }),
  node({
    id: f8bIds.cathedrale,
    type: T.paroisse,
    name: 'Cathédrale Notre-Dame-des-Victoires',
    code: 'PAR-DKR-PM-001',
    depth: 4,
    parent_id: f8bIds.plateauMedina,
  }),
  node({
    id: f8bIds.saintJoseph,
    type: T.paroisse,
    name: 'Saint-Joseph de Médina',
    code: 'PAR-DKR-PM-007',
    depth: 4,
    parent_id: f8bIds.plateauMedina,
    status: 'en_fondation',
  }),
  node({
    id: f8bIds.sainteTherese,
    type: T.paroisse,
    name: 'Sainte-Thérèse de Grand-Dakar',
    code: 'PAR-DKR-GD-003',
    depth: 4,
    parent_id: f8bIds.grandDakar,
  }),
  node({
    id: f8bIds.cebBakhita,
    type: T.ceb,
    name: 'CEB Sainte-Joséphine-Bakhita',
    code: 'CEB-SD-01',
    depth: 5,
    parent_id: ids.saintDominique,
  }),
];

export const nodeTypes = [
  { code: 'province', label: 'Province ecclésiastique', is_territorial: true, holds_registers: false, order: 10, allowed_parent_types: [] },
  { code: 'diocese', label: 'Diocèse', is_territorial: true, holds_registers: false, order: 20, allowed_parent_types: ['province'] },
  { code: 'doyenne', label: 'Doyenné', is_territorial: true, holds_registers: false, order: 40, allowed_parent_types: ['diocese', 'zone'] },
  {
    code: 'paroisse',
    label: 'Paroisse',
    is_territorial: true,
    holds_registers: true,
    order: 50,
    allowed_parent_types: ['doyenne', 'zone', 'diocese'],
  },
  {
    code: 'ceb',
    label: 'Communauté ecclésiale de base',
    is_territorial: true,
    holds_registers: false,
    order: 70,
    allowed_parent_types: ['paroisse', 'quasi_paroisse'],
  },
];

export const officeCatalogue = [
  {
    code: 'chancelier',
    label: 'Chancelier',
    node_types: ['diocese'],
    required_order: 'aucun',
    cardinality: 'one',
    appointed_by: ['eveque_diocesain'],
    appointed_by_platform: false,
    capabilities: ['structure.gerer', 'offices.nommer', 'personnes.verifier', 'tableau_bord.voir', 'audit.voir'],
    inherits_down: true,
  },
  {
    code: 'cure',
    label: 'Curé',
    node_types: ['paroisse', 'quasi_paroisse'],
    required_order: 'pretre',
    cardinality: 'one',
    appointed_by: ['eveque_diocesain', 'chancelier'],
    appointed_by_platform: false,
    capabilities: ['horaires.gerer', 'annonces.publier', 'actes.traiter', 'messagerie.recevoir_fideles', 'tableau_bord.voir'],
    inherits_down: true,
  },
  {
    code: 'secretaire_paroissial',
    label: 'Secrétaire paroissiale',
    node_types: ['paroisse', 'quasi_paroisse'],
    required_order: 'aucun',
    cardinality: 'many',
    appointed_by: ['cure'],
    appointed_by_platform: false,
    capabilities: [
      'horaires.gerer',
      'annonces.publier',
      'evenements.gerer',
      'actes.traiter',
      'confessions.voir_planning',
      'tableau_bord.voir',
    ],
    inherits_down: true,
  },
];

export const places = [
  {
    id: 1,
    node_id: ids.saintDominique,
    name: 'Église Saint-Dominique',
    kind: 'eglise_paroissiale',
    is_main: true,
    address: 'Point E',
    city: 'Dakar',
    lat: null,
    lng: null,
    is_active: true,
  },
  {
    id: 2,
    node_id: ids.saintDominique,
    name: 'Chapelle de la Cité universitaire',
    kind: 'chapelle',
    is_main: false,
    address: 'Campus social de l’UCAD',
    city: 'Dakar',
    lat: null,
    lng: null,
    is_active: true,
  },
];

const person = (id: string, first: string, email: string) => ({ id, email, full_name: first });
const ref = (id: string, name: string, code: string, type: string) => ({ id, name, code, type });

export const initialAssignments = () => [
  {
    id: 11,
    person: person('p-1', 'Abbé Augustin Ndiaye', 'a.ndiaye@example.sn'),
    office: 'cure',
    office_label: 'Curé',
    node: ref(ids.saintDominique, 'Saint-Dominique', 'PAR-DKR-PM-014', 'paroisse'),
    start_date: '2021-10-01',
    end_date: null as string | null,
    status: 'active',
    appointed_by_id: null,
    decree_ref: '',
    note: '',
    created_at: '2021-09-20T10:00:00+00:00',
  },
  {
    id: 12,
    person: person('p-2', 'Abbé Ignace Ndour', 'i.ndour@example.sn'),
    office: 'vicaire_paroissial',
    office_label: 'Vicaire paroissial',
    node: ref(ids.saintDominique, 'Saint-Dominique', 'PAR-DKR-PM-014', 'paroisse'),
    start_date: '2026-10-01',
    end_date: null as string | null,
    status: 'proposee',
    appointed_by_id: null,
    decree_ref: '',
    note: '',
    created_at: '2026-09-23T18:22:10+00:00',
  },
  {
    id: 13,
    person: person('p-3', 'Mme Germaine Faye', 'g.faye@example.sn'),
    office: 'secretaire_paroissial',
    office_label: 'Secrétaire paroissiale',
    node: ref(ids.saintDominique, 'Saint-Dominique', 'PAR-DKR-PM-014', 'paroisse'),
    start_date: '2019-09-01',
    end_date: null as string | null,
    status: 'active',
    appointed_by_id: null,
    decree_ref: '',
    note: '',
    created_at: '2019-08-20T10:00:00+00:00',
  },
];

export const initialVerifications = () => [
  {
    id: f8bIds.prePersonne,
    email: 'luc.bassene@example.sn',
    etat_de_vie: 'clerc',
    degre_ordre: 'pretre',
    statut_verification: 'declare',
    verification_note: '',
    incardination_node: null,
    institut_node: ref('i-svd', 'Société du Verbe Divin', 'SVD', 'institut'),
  },
];

export const initialOverrides = () => [{ id: 1, diocese_node_id: ids.dakar, office: 'cure', capability: 'horaires.gerer' }];

export const auditEvents = [
  {
    id: 3,
    at: '2026-09-24T10:44:05+00:00',
    actor_id: '5f0c0000-0000-4000-8000-0000000000d1',
    action: 'office.nomination',
    target_type: 'hierarchy.OfficeAssignment',
    target_id: '12',
    node_id: ids.saintDominique,
    metadata: { office: 'vicaire_paroissial' },
  },
  {
    id: 2,
    at: '2026-09-24T09:47:22+00:00',
    actor_id: '5f0c0000-0000-4000-8000-0000000000d2',
    action: 'acte.mark_ready',
    target_type: 'documents.DocumentRequest',
    target_id: '403',
    node_id: ids.saintDominique,
    metadata: {},
  },
  {
    id: 1,
    at: '2026-09-22T16:05:37+00:00',
    actor_id: null,
    action: 'capacite.retrait',
    target_type: 'hierarchy.CapabilityOverride',
    target_id: '1',
    node_id: ids.dakar,
    metadata: {},
  },
];

export const nodeDashboard = (nodeId: string, name: string, type: string) => ({
  node: { id: nodeId, name, type },
  period_days: 30,
  generated_at: '2026-09-24T06:00:00+00:00',
  fideles: { attached: 214, active: 131, new: 8 },
  annonces: { published: 3, reads: 1480, reads_per_article: 493.3 },
  evenements: { upcoming: 4, registrations: 37 },
  actes: {
    counts: { submitted: 3, under_verification: 5, info_requested: 1, ready_for_pickup: 2, collected: 5, rejected: 1, cancelled: 0 },
    total: 17,
    received: 17,
    median_days_to_collect: 4,
    overdue: 2,
  },
  messagerie: { conversations: 9, median_first_reply_hours: 5, unanswered_48h: 1 },
  confessions: { slots_offered: 18, booked: 12, honoured: 9, absent: 1, cancelled: 2, upcoming_booked: 6 },
});

export const platformDashboard = {
  generated_at: '2026-09-24T10:45:00+00:00',
  accounts: { total: 312, active_30d: 241, new_30d: 57 },
  staff: { total: 14, with_mfa_30d: 14, mfa_share: 1 },
  health: { emails_failed_7d: 2, document_requests_overdue: 2, beat_stale: 1 },
  beat: [
    { name: 'Lectures du jour', task: 'apps.liturgy.tasks.prepare', enabled: true, last_run_at: '2026-09-24T02:00:41+00:00', stale: false },
    {
      name: 'Relance des actes en retard',
      task: 'apps.documents.tasks.remind',
      enabled: true,
      last_run_at: '2026-09-20T07:00:03+00:00',
      stale: true,
    },
  ],
};

type Account = {
  id: string;
  email: string;
  full_name: string;
  realm_role: 'fidele' | 'staff' | 'platform_admin';
  mfa: 'totp' | 'webauthn' | 'facultative';
  last_login: string | null;
  status: 'actif' | 'verrouille' | 'a_confirmer';
  node_label: string | null;
};

export const initialAccounts = (): Account[] => [
  {
    id: f8bIds.accountFaye,
    email: 'g.faye@example.sn',
    full_name: 'Mme Germaine Faye',
    realm_role: 'staff',
    mfa: 'totp',
    last_login: '2026-09-24T08:12:00+00:00',
    status: 'actif',
    node_label: 'Saint-Dominique',
  },
  {
    id: f8bIds.accountNdour,
    email: 'p.ndour@example.sn',
    full_name: 'Pierre Ndour',
    realm_role: 'fidele',
    mfa: 'facultative',
    last_login: '2026-09-24T07:03:00+00:00',
    status: 'verrouille',
    node_label: 'Saint-Dominique',
  },
];

export const accountExtras: Record<string, object> = {
  [f8bIds.accountFaye]: {
    keycloak_id: '7c1e04b2-0000-4000-8000-00000000a42f',
    email_verified: true,
    offices: [
      {
        office_label: 'Secrétaire paroissiale',
        node_name: 'Saint-Dominique',
        start_date: '2019-09-01',
        capabilities: ['annonces.publier', 'horaires.gerer', 'actes.traiter', 'tableau_bord.voir'],
      },
    ],
    sessions: [{ id: 's1', client: 'Firefox · Windows', ip: '41.82.140.23', started_at: '2026-09-24T08:12:00+00:00' }],
  },
  [f8bIds.accountNdour]: { keycloak_id: null, email_verified: true, offices: [], sessions: [] },
};

/** État mutable des handlers (réinitialisé par `resetF8b`). */
export const f8bState = {
  nodes: initialNodes(),
  assignments: initialAssignments(),
  verifications: initialVerifications(),
  overrides: initialOverrides(),
  accounts: initialAccounts(),
  requests: [] as { method: string; url: string; body?: unknown }[],
};

export const resetF8b = () => {
  f8bState.nodes = initialNodes();
  f8bState.assignments = initialAssignments();
  f8bState.verifications = initialVerifications();
  f8bState.overrides = initialOverrides();
  f8bState.accounts = initialAccounts();
  f8bState.requests = [];
};
