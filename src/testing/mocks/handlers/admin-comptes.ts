import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

import { NOEUD_ARCHIDIOCESE, NOEUD_SAINT_DOMINIQUE } from './dons-analyse';

// Administration des comptes synchronisée avec Keycloak (`/admin/…`).
// Réponses calquées sur le backend (apps/users/apis_admin.py, schema.yml de
// la branche claude/v1-admin-keycloak) ; données fictives de l'archidiocèse.

const API = env.API_URL;
const A = `${API}/admin`;

const ARCHI = { id: NOEUD_ARCHIDIOCESE, name: 'Archidiocèse de Dakar' };
const SD = { id: NOEUD_SAINT_DOMINIQUE, name: 'Saint-Dominique (Point E)' };

export const COMPTE_MARIE = 'ac000000-0000-4000-8000-000000000001';
export const COMPTE_TINE = 'ac000000-0000-4000-8000-000000000002';
export const COMPTE_COLY = 'ac000000-0000-4000-8000-000000000003';
export const COMPTE_MENDY = 'ac000000-0000-4000-8000-000000000006';
export const COMPTE_GOMIS = 'ac000000-0000-4000-8000-000000000009';

type Compte = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string | null;
  status: 'actif' | 'desactive' | 'en_attente';
  role: 'fidele' | 'staff' | 'platform_admin';
  etat_de_vie: 'laic' | 'clerc' | 'consacre';
  email_verified: boolean;
  keycloak_id: string | null;
  sync: 'synchronise' | 'non_lie' | 'ecart';
  sync_error: string | null;
  synced_at: string | null;
  admin_node: { id: string; name: string } | null;
  created_at: string;
  last_login: string | null;
  last_seen_on: string | null;
  can_manage: boolean;
};

const compte = (
  n: number,
  first_name: string,
  last_name: string,
  email: string,
  o: Partial<Compte> = {},
): Compte => ({
  id: `ac000000-0000-4000-8000-00000000000${n}`,
  email,
  first_name,
  last_name,
  full_name: `${first_name} ${last_name}`,
  phone_number: null,
  status: 'actif',
  role: 'fidele',
  etat_de_vie: 'laic',
  email_verified: true,
  keycloak_id: `kc-${n}`,
  sync: 'synchronise',
  sync_error: null,
  synced_at: '2026-09-29T06:00:00Z',
  admin_node: SD,
  created_at: '2023-03-14T10:00:00Z',
  last_login: '2026-09-29T08:12:00Z',
  last_seen_on: '2026-09-29',
  can_manage: true,
  ...o,
});

const initiaux = (): Compte[] => [
  compte(1, 'Marie-Thérèse', 'Diouf', 'mt.diouf@exemple.sn'),
  compte(2, 'Emmanuel', 'Tine', 'e.tine@exemple.sn', {
    full_name: 'Père Emmanuel Tine',
    role: 'staff',
    etat_de_vie: 'clerc',
    can_manage: false,
  }),
  compte(3, 'Cécile', 'Coly', 'c.coly@exemple.sn', {
    full_name: 'Mme Cécile Coly',
    role: 'staff',
  }),
  compte(4, 'Germaine', 'Faye', 'g.faye@exemple.sn', { role: 'staff' }),
  compte(5, 'Awa', 'Ndiaye', 'awa.ndiaye@exemple.sn', {
    status: 'en_attente',
    email_verified: false,
    last_login: null,
    keycloak_id: null,
    sync: 'non_lie',
  }),
  compte(6, 'Jean-Baptiste', 'Mendy', 'jb.mendy@exemple.sn', {
    phone_number: '+221 77 123 45 67',
    last_login: '2026-09-25T18:02:00Z',
  }),
  compte(7, 'Paul', 'Sarr', 'p.sarr@exemple.sn', {
    email_verified: false,
    sync: 'ecart',
    sync_error: 'champs_differents',
  }),
  compte(8, 'Agnès', 'Sarr', 'a.sarr@exemple.sn', { status: 'desactive' }),
  compte(9, 'Pierre', 'Gomis', 'p.gomis@exemple.sn', {
    role: 'platform_admin',
    admin_node: ARCHI,
  }),
];

let comptes = initiaux();
let offices: Record<string, object[]> = {};
let verrouilles = new Set<string>();
let sessions: Record<string, object[]> = {};
let audit: object[] = [];
let nextId = 100;
let runs: object[] = [];

const officesInitiaux = () => ({
  [COMPTE_TINE]: [
    {
      id: 11,
      office: 'cure',
      office_label: 'Curé',
      node: SD,
      status: 'active',
      start_date: '2022-09-01',
      end_date: null,
    },
  ],
  [COMPTE_COLY]: [
    {
      id: 12,
      office: 'econome_paroissial',
      office_label: 'Économe',
      node: SD,
      status: 'active',
      start_date: '2024-01-03',
      end_date: null,
    },
  ],
});

const sessionsInitiales = () => ({
  [COMPTE_MENDY]: [
    {
      id: 'sess-1',
      ip: '41.82.0.1',
      started_at: '2026-09-28T20:00:00Z',
      last_access: '2026-09-28T20:50:00Z',
      clients: ['jangubi-mobile'],
    },
    {
      id: 'sess-2',
      ip: '41.82.0.2',
      started_at: '2026-09-26T09:00:00Z',
      last_access: '2026-09-26T10:02:00Z',
      clients: ['jangubi-web'],
    },
  ],
});

const auditInitial = () => [
  {
    id: 3,
    at: '2026-09-29T09:42:00Z',
    action: 'compte.admin.creation',
    actor_id: null,
    actor_email: 'g.faye@exemple.sn',
    target_id: 'ac000000-0000-4000-8000-000000000005',
    target_email: 'awa.ndiaye@exemple.sn',
    node: SD,
    metadata: {},
  },
  {
    id: 2,
    at: '2026-09-29T09:15:00Z',
    action: 'compte.admin.actions_email',
    actor_id: COMPTE_GOMIS,
    actor_email: 'p.gomis@exemple.sn',
    target_id: COMPTE_MENDY,
    target_email: 'jb.mendy@exemple.sn',
    node: SD,
    metadata: { actions: ['UPDATE_PASSWORD'] },
  },
  {
    id: 1,
    at: '2026-09-27T16:40:00Z',
    action: 'compte.admin.desactivation',
    actor_id: COMPTE_GOMIS,
    actor_email: 'p.gomis@exemple.sn',
    target_id: 'ac000000-0000-4000-8000-000000000008',
    target_email: 'a.sarr@exemple.sn',
    node: SD,
    metadata: { motif: 'Départ de la paroisse' },
  },
];

const runsInitiaux = () => [
  {
    id: 3,
    started_at: '2026-09-29T06:00:00Z',
    finished_at: '2026-09-29T06:00:42Z',
    dry_run: true,
    trigger: 'tache',
    success: true,
    error: '',
    counts: {
      keycloak: 4896,
      application: 4894,
      erreurs: 0,
      application_seule: 2,
      keycloak_seul: 1,
      champs_differents: 2,
      ecarts: 5,
    },
    report: [
      {
        kind: 'application_seule',
        keycloak_id: '',
        user_id: 'ac000000-0000-4000-8000-000000000005',
        email: 'a***@exemple.sn',
        fields: [],
        correction: 'creer_dans_keycloak',
      },
      {
        kind: 'keycloak_seul',
        keycloak_id: 'kc-test-2',
        user_id: '',
        email: 't***@exemple.sn',
        fields: [],
        correction: 'cree',
      },
      {
        kind: 'champs_differents',
        keycloak_id: 'kc-7',
        user_id: 'ac000000-0000-4000-8000-000000000007',
        email: 'p***@exemple.sn',
        fields: ['email'],
        correction: 'mis_a_jour',
      },
    ],
  },
  {
    id: 2,
    started_at: '2026-09-27T06:00:00Z',
    finished_at: '2026-09-27T06:00:10Z',
    dry_run: false,
    trigger: 'tache',
    success: false,
    error: 'Keycloak injoignable',
    counts: {},
    report: [],
  },
];

export const resetAdminComptesMocks = () => {
  comptes = initiaux();
  offices = officesInitiaux();
  verrouilles = new Set([COMPTE_MENDY]);
  sessions = sessionsInitiales();
  audit = auditInitial();
  runs = runsInitiaux();
  nextId = 100;
};
resetAdminComptesMocks();

const erreur = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message, details: {} } }, { status });

const page = <T>(rows: T[], request: Request, defaut = 25) => {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? defaut);
  const offset = Number(url.searchParams.get('offset') ?? 0);
  return {
    count: rows.length,
    limit,
    offset,
    next: offset + limit < rows.length ? 'next' : null,
    previous: offset > 0 ? 'prev' : null,
    results: rows.slice(offset, offset + limit),
  };
};

const detail = (c: Compte) => ({
  ...c,
  statut_verification: 'non_requise',
  degre_ordre: 'aucun',
  offices: offices[c.id] ?? [],
  scope_nodes: c.admin_node ? [c.admin_node] : [],
  keycloak: c.keycloak_id
    ? {
        available: true,
        exists: true,
        enabled: c.status !== 'desactive',
        email_verified: c.email_verified,
        required_actions: [],
        otp: c.id === COMPTE_MENDY,
        webauthn: false,
        password: true,
        realm_roles: [c.role],
        groups: [],
        locked_by_brute_force: verrouilles.has(c.id),
        failed_logins: verrouilles.has(c.id) ? 5 : 0,
        sessions: sessions[c.id] ?? [],
      }
    : null,
});

const journaliser = (c: Compte, action: string, metadata: object = {}) => {
  audit.unshift({
    id: nextId++,
    at: new Date().toISOString(),
    action: `compte.admin.${action}`,
    actor_id: COMPTE_GOMIS,
    actor_email: 'p.gomis@exemple.sn',
    target_id: c.id,
    target_email: c.email,
    node: c.admin_node,
    metadata,
  });
};

type Corps = Record<string, unknown>;
const lire = async (request: Request): Promise<Corps> => {
  try {
    return ((await request.json()) as Corps) ?? {};
  } catch {
    return {};
  }
};

const trouver = (id: string) => comptes.find((c) => c.id === id);

const MOTIF_REQUIS = new Set([
  'disable',
  'mark-email-verified',
  'otp-reset',
  'platform-admin',
]);

export const adminComptesHandlers = [
  http.get(`${A}/scope/`, () =>
    HttpResponse.json({
      is_platform_admin: true,
      nodes: [ARCHI, SD],
      required_actions: [
        'UPDATE_PASSWORD',
        'VERIFY_EMAIL',
        'CONFIGURE_TOTP',
        'UPDATE_PROFILE',
      ],
      impersonation: false,
    }),
  ),

  http.get(`${A}/dashboard/`, () =>
    HttpResponse.json({
      comptes: {
        total: comptes.length,
        actifs: comptes.filter((c) => c.status === 'actif').length,
        en_attente: comptes.filter((c) => c.status === 'en_attente').length,
        desactives: comptes.filter((c) => c.status === 'desactive').length,
        responsables: comptes.filter((c) => c.role === 'staff').length,
        administrateurs_plateforme: comptes.filter(
          (c) => c.role === 'platform_admin',
        ).length,
        crees_30_jours: 1,
        non_lies: comptes.filter((c) => c.sync === 'non_lie').length,
        ecarts: comptes.filter((c) => c.sync === 'ecart').length,
        invitations_en_attente: 1,
      },
      synchronisation: {
        derniere_reconciliation: '2026-09-29T06:00:00Z',
        derniere_reconciliation_reussie: true,
        ecarts_derniere_reconciliation: 5,
      },
    }),
  ),

  http.get(
    `${A}/accounts/export/`,
    () =>
      new HttpResponse('id;email\n', {
        headers: { 'Content-Type': 'text/csv; charset=utf-8' },
      }),
  ),

  http.get(`${A}/accounts/`, ({ request }) => {
    const p = new URL(request.url).searchParams;
    const q = (p.get('q') ?? '').toLowerCase();
    const rows = comptes.filter(
      (c) =>
        (!q ||
          c.full_name.toLowerCase().includes(q) ||
          c.email.includes(q) ||
          (c.phone_number ?? '').includes(q)) &&
        (!p.get('status') || c.status === p.get('status')) &&
        (!p.get('role') || c.role === p.get('role')) &&
        (!p.get('sync') || c.sync === p.get('sync')) &&
        (!p.get('etat_de_vie') || c.etat_de_vie === p.get('etat_de_vie')) &&
        (!p.get('node') || c.admin_node?.id === p.get('node')),
    );
    return HttpResponse.json(page(rows, request));
  }),

  http.post(`${A}/accounts/`, async ({ request }) => {
    const b = await lire(request);
    const email = String(b.email ?? '').toLowerCase();
    if (comptes.some((c) => c.email === email))
      return erreur(409, 'account_exists', 'Un compte existe déjà.');
    const node = [ARCHI, SD].find((n) => n.id === b.node_id);
    if (!node) return erreur(403, 'node_out_of_scope', 'Nœud hors périmètre.');
    const n = nextId++;
    const c: Compte = {
      ...compte(
        0,
        String(b.first_name ?? ''),
        String(b.last_name ?? ''),
        email,
      ),
      id: `ac000000-0000-4000-8000-000000000${n}`,
      phone_number: (b.phone_number as string) ?? null,
      etat_de_vie: (b.etat_de_vie as Compte['etat_de_vie']) ?? 'laic',
      status: 'en_attente',
      email_verified: false,
      last_login: null,
      admin_node: node,
      created_at: new Date().toISOString(),
    };
    comptes.unshift(c);
    journaliser(c, 'creation');
    return HttpResponse.json(c, { status: 201 });
  }),

  http.get(`${A}/accounts/:id/`, ({ params }) => {
    const c = trouver(String(params.id));
    if (!c) return erreur(404, 'not_found', 'Introuvable.');
    return HttpResponse.json(detail(c));
  }),

  http.patch(`${A}/accounts/:id/`, async ({ params, request }) => {
    const c = trouver(String(params.id));
    if (!c) return erreur(404, 'not_found', 'Introuvable.');
    const b = await lire(request);
    if (b.email && comptes.some((x) => x.email === b.email && x.id !== c.id))
      return erreur(409, 'keycloak_conflict', 'E-mail déjà utilisé.');
    Object.assign(c, {
      ...(b.first_name != null && { first_name: b.first_name }),
      ...(b.last_name != null && { last_name: b.last_name }),
      ...(b.email != null && { email: b.email }),
      ...(b.phone_number !== undefined && { phone_number: b.phone_number }),
    });
    c.full_name = `${c.first_name} ${c.last_name}`;
    journaliser(c, 'modification');
    return HttpResponse.json(c);
  }),

  http.delete(`${A}/accounts/:id/`, async ({ params, request }) => {
    const c = trouver(String(params.id));
    if (!c) return erreur(404, 'not_found', 'Introuvable.');
    const b = await lire(request);
    if (c.id === COMPTE_GOMIS)
      return erreur(403, 'self_action', 'Action sur soi.');
    if (!b.reason || String(b.confirm_email).toLowerCase() !== c.email)
      return erreur(400, 'validation_error', 'Motif et e-mail requis.');
    if ((offices[c.id] ?? []).length > 0)
      return erreur(409, 'active_office', 'Nomination en cours.');
    comptes = comptes.filter((x) => x.id !== c.id);
    journaliser(c, 'suppression', { motif: b.reason });
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${A}/accounts/:id/offices/:aid/end/`, ({ params }) => {
    const id = String(params.id);
    const o = (offices[id] ?? []).find(
      (x) => (x as { id: number }).id === Number(params.aid),
    );
    if (!o) return erreur(404, 'not_found', 'Introuvable.');
    offices[id] = (offices[id] ?? []).filter((x) => x !== o);
    return HttpResponse.json({ ...o, status: 'ended', end_date: '2026-09-29' });
  }),

  http.post(`${A}/accounts/:id/offices/`, async ({ params, request }) => {
    const id = String(params.id);
    const b = await lire(request);
    const o = {
      id: nextId++,
      office: String(b.office_type),
      office_label: String(b.office_type),
      node: [ARCHI, SD].find((n) => n.id === b.node_id) ?? SD,
      status: 'active',
      start_date: '2026-09-29',
      end_date: null,
    };
    offices[id] = [...(offices[id] ?? []), o];
    return HttpResponse.json(o, { status: 201 });
  }),

  http.get(`${A}/accounts/:id/sessions/`, ({ params }) =>
    HttpResponse.json(sessions[String(params.id)] ?? []),
  ),

  http.delete(`${A}/accounts/:id/sessions/:sid/`, ({ params }) => {
    const id = String(params.id);
    sessions[id] = (sessions[id] ?? []).filter(
      (s) => (s as { id: string }).id !== params.sid,
    );
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${A}/accounts/:id/:action/`, async ({ params, request }) => {
    const c = trouver(String(params.id));
    if (!c) return erreur(404, 'not_found', 'Introuvable.');
    const action = String(params.action);
    const b = await lire(request);
    if (MOTIF_REQUIS.has(action) && !String(b.reason ?? '').trim())
      return erreur(400, 'validation_error', 'Motif obligatoire.');
    if (
      c.id === COMPTE_GOMIS &&
      ['disable', 'otp-reset', 'logout', 'platform-admin'].includes(action)
    )
      return erreur(403, 'self_action', 'Action sur soi.');
    switch (action) {
      case 'disable':
        c.status = 'desactive';
        sessions[c.id] = [];
        journaliser(c, 'desactivation', { motif: b.reason });
        break;
      case 'enable':
        c.status = 'actif';
        verrouilles.delete(c.id);
        journaliser(c, 'reactivation');
        break;
      case 'brute-force-unlock':
        verrouilles.delete(c.id);
        journaliser(c, 'deblocage_force_brute');
        break;
      case 'logout':
        sessions[c.id] = [];
        journaliser(c, 'deconnexion_sessions');
        break;
      case 'mark-email-verified':
        c.email_verified = true;
        journaliser(c, 'email_marque_verifie', { motif: b.reason });
        break;
      case 'platform-admin':
        if (
          !b.grant &&
          comptes.filter((x) => x.role === 'platform_admin').length <= 1
        )
          return erreur(409, 'last_platform_admin', 'Dernier admin.');
        c.role = b.grant ? 'platform_admin' : 'fidele';
        break;
      case 'password-reset':
      case 'actions-email':
        journaliser(c, 'actions_email');
        break;
      case 'otp-reset':
        journaliser(c, 'otp_reinitialise', { motif: b.reason });
        break;
      case 'verify-email':
        journaliser(c, 'verification_email_envoyee');
        break;
      case 'resync':
        journaliser(c, 'resynchronisation');
        break;
      default:
        return erreur(404, 'not_found', 'Action inconnue.');
    }
    return HttpResponse.json(c);
  }),

  http.get(`${A}/audit/`, ({ request }) => {
    const p = new URL(request.url).searchParams;
    const rows = audit.filter((e) => {
      const x = e as { target_id: string; action: string };
      return (
        (!p.get('account') || x.target_id === p.get('account')) &&
        (!p.get('action') || x.action.startsWith(p.get('action')!))
      );
    });
    return HttpResponse.json(page(rows, request));
  }),

  http.get(`${A}/sync/`, () =>
    HttpResponse.json({
      enabled: true,
      events_polling: true,
      webhook_enabled: false,
      curseurs: [
        {
          name: 'utilisateur',
          last_event_at: '2026-09-29T09:40:00Z',
          last_polled_at: '2026-09-29T09:41:00Z',
          last_error: null,
        },
      ],
      comptes_non_lies: comptes.filter((c) => c.sync === 'non_lie').length,
      comptes_en_ecart: comptes.filter((c) => c.sync === 'ecart').length,
      ecarts_par_type: {
        application_seule: 2,
        keycloak_seul: 1,
        champs_differents: 2,
      },
      evenements: {
        recus: 1240,
        echecs: 0,
        traites_24h: 38,
        dernier_recu: '2026-09-29T09:40:00Z',
      },
      reconciliations: runs.map((r) => {
        const { report: _r, ...reste } = r as { report: unknown };
        return reste;
      }),
    }),
  ),

  http.post(`${A}/sync/runs/`, async ({ request }) => {
    const b = await lire(request);
    const base = runs[0] as { counts: object; report: object[] };
    const run = {
      ...base,
      id: nextId++,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      dry_run: b.dry_run !== false,
      trigger: 'admin',
      success: true,
      error: '',
    };
    runs.unshift(run);
    return HttpResponse.json(run, { status: 201 });
  }),

  http.get(`${A}/sync/runs/:rid/`, ({ params }) => {
    const r = runs.find((x) => (x as { id: number }).id === Number(params.rid));
    return r ? HttpResponse.json(r) : erreur(404, 'not_found', 'Introuvable.');
  }),
];
