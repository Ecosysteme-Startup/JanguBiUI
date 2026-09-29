import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

import { NOEUD_ARCHIDIOCESE, NOEUD_SAINT_DOMINIQUE } from './dons-analyse';

// Écrans staff hérités (paroisse, diocèse, plateforme) branchés sur les routes
// V1 : exemples calqués sur les sérialiseurs du backend (docs/BRANCHEMENT-STAFF.md).
// Données fictives : paroisse Saint-Dominique (Point E), Père Emmanuel Tine,
// Mme Cécile Coly, dimanche 27 septembre 2026.

const API = env.API_URL;

const page = <T>(rows: T[], request: Request, defaut = 10) => {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? defaut);
  const offset = Number(url.searchParams.get('offset') ?? 0);
  return {
    limit,
    offset,
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

const NOEUD_SD = { id: NOEUD_SAINT_DOMINIQUE, name: 'Saint-Dominique' };

// --- Demandes d'actes (/v1/staff/documents/) ------------------------------------

type Acte = Record<string, unknown> & { id: string; status: string };

const LIBELLES: Record<string, string> = {
  submitted: 'Soumise',
  under_verification: 'En vérification',
  info_requested: 'Complément demandé',
  ready_for_pickup: 'Prête à retirer',
  collected: 'Retirée',
  rejected: 'Rejetée',
  cancelled: 'Annulée',
};

const acte = (
  id: string,
  reference: string,
  status: string,
  overrides: Partial<Acte> = {},
): Acte => ({
  id,
  reference,
  document_type: 'baptism',
  document_type_label: 'Certificat de baptême',
  document_type_free: '',
  reason: 'religious_marriage',
  reason_label: 'Mariage religieux',
  reason_free: '',
  status,
  status_label: LIBELLES[status],
  target_node: NOEUD_SD,
  requester_last_name: 'Diouf',
  requester_first_names: 'Marie-Thérèse',
  requester_name: 'Diouf Marie-Thérèse',
  date_of_birth: '1988-03-12',
  place_of_birth: 'Dakar',
  contact_phone: '+221 77 000 00 00',
  contact_email: 'marie-therese.diouf@example.sn',
  registered_last_name: 'Diouf',
  registered_first_names: 'Marie-Thérèse',
  father_last_name: 'Diouf',
  mother_last_name: 'Sarr',
  sacrament_approximate_date: '1988',
  sacrament_location: 'Saint-Dominique',
  additional_info: '',
  document_details: {},
  rejection_reason: '',
  pickup: null,
  can_cancel: false,
  indicative_days: 7,
  estimated_ready_on: '2026-10-02',
  assigned_to_id: null,
  assigned_to_name: null,
  age_days: 2,
  is_overdue: false,
  register: { volume: '', page: '', number: '', marginal_notes: '' },
  pickup_mode: 'secretariat',
  attachments: [],
  history: [
    {
      from_status: '',
      to_status: 'submitted',
      comment: '',
      created_at: '2026-09-25T09:00:00+00:00',
      changed_by_id: null,
      changed_by_name: 'Marie-Thérèse Diouf',
      by_requester: true,
    },
  ],
  created_at: '2026-09-25T09:00:00+00:00',
  updated_at: '2026-09-25T09:00:00+00:00',
  closed_at: null,
  ...overrides,
});

const actesInitiaux = (): Acte[] => [
  acte('a1000000-0000-4000-8000-000000000001', 'SD-2026-0142', 'submitted'),
  acte(
    'a1000000-0000-4000-8000-000000000002',
    'SD-2026-0139',
    'under_verification',
    {
      document_type: 'confirmation',
      document_type_label: 'Attestation de confirmation',
      requester_last_name: 'Ndiaye',
      requester_first_names: 'Paul',
      requester_name: 'Ndiaye Paul',
      assigned_to_id: '0c7b0000-0000-4000-8000-000000000003',
      assigned_to_name: 'Emmanuel Tine',
      age_days: 12,
      is_overdue: true,
    },
  ),
  acte(
    'a1000000-0000-4000-8000-000000000003',
    'SD-2026-0131',
    'ready_for_pickup',
    {
      requester_last_name: 'Mendy',
      requester_first_names: 'Odile',
      requester_name: 'Mendy Odile',
    },
  ),
];

let actes = actesInitiaux();
let notes: Record<
  string,
  {
    id: number;
    author_id: string;
    author_name: string;
    content: string;
    created_at: string;
  }[]
> = {};

const TRANSITIONS: Record<string, Record<string, string>> = {
  'start-verification': {
    submitted: 'under_verification',
    info_requested: 'under_verification',
  },
  'request-info': {
    submitted: 'info_requested',
    under_verification: 'info_requested',
  },
  'mark-ready': { under_verification: 'ready_for_pickup' },
  'mark-collected': { ready_for_pickup: 'collected' },
  reject: {
    submitted: 'rejected',
    under_verification: 'rejected',
    info_requested: 'rejected',
  },
};

const EQUIPE = [
  { id: '0c7b0000-0000-4000-8000-000000000003', full_name: 'Emmanuel Tine' },
  { id: '0c7b0000-0000-4000-8000-000000000004', full_name: 'Germaine Faye' },
];

const staffDocumentsHandlers = [
  http.get(`${API}/v1/staff/documents/counts/`, () => {
    const counts: Record<string, number> = {};
    for (const a of actes) counts[a.status] = (counts[a.status] ?? 0) + 1;
    return HttpResponse.json({ counts, total: actes.length });
  }),
  http.get(`${API}/v1/staff/documents/`, ({ request }) => {
    const url = new URL(request.url);
    const statut = url.searchParams.get('status');
    const q = (url.searchParams.get('search') ?? '').toLowerCase();
    const retard = url.searchParams.get('overdue') === 'true';
    const rows = actes
      .filter((a) => !statut || a.status === statut)
      .filter((a) => !retard || a.is_overdue)
      .filter(
        (a) =>
          !q ||
          String(a.reference).toLowerCase().includes(q) ||
          String(a.requester_name).toLowerCase().includes(q),
      );
    return HttpResponse.json(page(rows, request));
  }),
  http.get(`${API}/v1/staff/documents/:id/`, ({ params }) => {
    const a = actes.find((x) => x.id === params.id);
    return a
      ? HttpResponse.json(a)
      : erreur(404, 'not_found', 'Demande introuvable.');
  }),
  http.get(`${API}/v1/staff/documents/:id/notes/`, ({ params }) =>
    HttpResponse.json(notes[String(params.id)] ?? []),
  ),
  http.post(
    `${API}/v1/staff/documents/:id/notes/`,
    async ({ params, request }) => {
      const { content } = (await request.json()) as { content: string };
      const liste = (notes[String(params.id)] ??= []);
      const note = {
        id: liste.length + 1,
        author_id: EQUIPE[0].id,
        author_name: EQUIPE[0].full_name,
        content,
        created_at: '2026-09-27T10:00:00+00:00',
      };
      liste.push(note);
      return HttpResponse.json(note, { status: 201 });
    },
  ),
  http.get(`${API}/v1/staff/documents/:id/assignees/`, () =>
    HttpResponse.json(EQUIPE),
  ),
  http.post(
    `${API}/v1/staff/documents/:id/assign/`,
    async ({ params, request }) => {
      const { assignee_id } = (await request.json()) as {
        assignee_id: string | null;
      };
      const a = actes.find((x) => x.id === params.id);
      if (!a) return erreur(404, 'not_found', 'Demande introuvable.');
      a.assigned_to_id = assignee_id;
      a.assigned_to_name =
        EQUIPE.find((p) => p.id === assignee_id)?.full_name ?? null;
      return HttpResponse.json(a);
    },
  ),
  http.post(
    `${API}/v1/staff/documents/:id/:transition/`,
    async ({ params, request }) => {
      const a = actes.find((x) => x.id === params.id);
      if (!a) return erreur(404, 'not_found', 'Demande introuvable.');
      const { message = '' } = (await request.json()) as { message?: string };
      const t = String(params.transition);
      if (t === 'reject' && !message.trim())
        return erreur(
          400,
          'reason_required',
          'Le motif du rejet est obligatoire.',
        );
      if (t === 'request-info' && !message.trim())
        return erreur(
          400,
          'message_required',
          'Précisez le complément attendu.',
        );
      const cible = TRANSITIONS[t]?.[a.status];
      if (!cible)
        return erreur(
          400,
          'invalid_transition',
          'Transition impossible depuis ce statut.',
        );
      (a.history as unknown[]).push({
        from_status: a.status,
        to_status: cible,
        comment: message,
        created_at: '2026-09-27T10:00:00+00:00',
        changed_by_id: EQUIPE[0].id,
        changed_by_name: EQUIPE[0].full_name,
        by_requester: false,
      });
      a.status = cible;
      a.status_label = LIBELLES[cible];
      if (t === 'reject') a.rejection_reason = message;
      return HttpResponse.json(a);
    },
  ),
];

// --- Annonces (/v1/staff/news/) ---------------------------------------------------

type Contenu = Record<string, unknown> & {
  id: string;
  status: string;
  title: string;
};

const CATEGORIES = [
  {
    id: 1,
    name: 'Vie paroissiale',
    slug: 'vie-paroissiale',
    icon: '',
    color: '',
    display_order: 1,
  },
  {
    id: 2,
    name: 'Liturgie',
    slug: 'liturgie',
    icon: '',
    color: '',
    display_order: 2,
  },
];

const contenu = (
  id: string,
  title: string,
  status: string,
  o: Partial<Contenu> = {},
): Contenu => ({
  id,
  content_type: 'announcement',
  title,
  slug: title.toLowerCase().replace(/\s+/g, '-'),
  excerpt: '',
  content: `${title}.`,
  content_format: 'text',
  category: CATEGORIES[0],
  author_name: 'Germaine Faye',
  scope: {
    node_id: NOEUD_SAINT_DOMINIQUE,
    node_name: 'Saint-Dominique',
    place_id: null,
    place_name: null,
  },
  is_sunday_notice: false,
  sunday_date: null,
  status,
  publish_at: null,
  published_at: status === 'published' ? '2026-09-26T08:00:00+00:00' : null,
  unpublished_at: null,
  unpublish_reason: '',
  cover_image_id: null,
  cover_image_url: null,
  cover_image_alt: '',
  cover_image_decorative: false,
  notify_followers: true,
  reads_count: status === 'published' ? 214 : 0,
  is_pinned: false,
  pinned_until: null,
  created_at: '2026-09-24T08:00:00+00:00',
  updated_at: '2026-09-26T08:00:00+00:00',
  ...o,
});

const contenusInitiaux = (): Contenu[] => [
  contenu(
    'c1000000-0000-4000-8000-000000000001',
    'Messe des familles du dimanche 27 septembre',
    'published',
    {
      is_sunday_notice: true,
      sunday_date: '2026-09-27',
    },
  ),
  contenu(
    'c1000000-0000-4000-8000-000000000002',
    'Reprise de la catéchèse',
    'draft',
  ),
];

let contenus = contenusInitiaux();

const staffNewsHandlers = [
  http.get(`${API}/v1/news/categories/`, () => HttpResponse.json(CATEGORIES)),
  http.get(`${API}/v1/staff/news/`, ({ request }) => {
    const statut = new URL(request.url).searchParams.get('status');
    return HttpResponse.json(
      page(
        contenus.filter((c) => !statut || c.status === statut),
        request,
      ),
    );
  }),
  http.post(`${API}/v1/staff/news/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    if (!body.node_id)
      return erreur(
        403,
        'permission_denied',
        'Vous ne pouvez pas publier ici.',
      );
    const c = contenu(
      `c1000000-0000-4000-8000-${String(contenus.length + 1).padStart(12, '0')}`,
      String(body.title),
      'draft',
      {
        content_type: body.content_type as string,
        content: String(body.content),
        excerpt: String(body.excerpt ?? ''),
        category: CATEGORIES.find((x) => x.id === body.category_id) ?? null,
        is_sunday_notice: !!body.is_sunday_notice,
        sunday_date: (body.sunday_date as string) ?? null,
      },
    );
    contenus.unshift(c);
    return HttpResponse.json(c, { status: 201 });
  }),
  http.get(`${API}/v1/staff/news/:id/`, ({ params }) => {
    const c = contenus.find((x) => x.id === params.id);
    return c
      ? HttpResponse.json(c)
      : erreur(404, 'not_found', 'Contenu introuvable.');
  }),
  http.patch(`${API}/v1/staff/news/:id/`, async ({ params, request }) => {
    const c = contenus.find((x) => x.id === params.id);
    if (!c) return erreur(404, 'not_found', 'Contenu introuvable.');
    Object.assign(c, (await request.json()) as object);
    return HttpResponse.json(c);
  }),
  http.delete(`${API}/v1/staff/news/:id/`, ({ params }) => {
    const c = contenus.find((x) => x.id === params.id);
    if (!c) return erreur(404, 'not_found', 'Contenu introuvable.');
    if (c.status === 'published')
      return erreur(
        400,
        'published',
        'Un article publié ou programmé ne peut pas être supprimé. Retirez-le d’abord.',
      );
    contenus = contenus.filter((x) => x !== c);
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(`${API}/v1/staff/news/:id/publish/`, ({ params }) => {
    const c = contenus.find((x) => x.id === params.id);
    if (!c) return erreur(404, 'not_found', 'Contenu introuvable.');
    c.status = 'published';
    c.published_at = '2026-09-27T09:00:00+00:00';
    return HttpResponse.json(c);
  }),
  http.post(`${API}/v1/staff/news/:id/pin/`, async ({ params, request }) => {
    const c = contenus.find((x) => x.id === params.id);
    if (!c) return erreur(404, 'not_found', 'Contenu introuvable.');
    if (c.status !== 'published' && c.status !== 'scheduled')
      return erreur(
        400,
        'not_published',
        'Seul un contenu publié ou programmé s’épingle.',
      );
    const { until } = (await request.json()) as { until: string };
    c.is_pinned = true;
    c.pinned_until = until;
    return HttpResponse.json(c);
  }),
  http.delete(`${API}/v1/staff/news/:id/pin/`, ({ params }) => {
    const c = contenus.find((x) => x.id === params.id);
    if (!c) return erreur(404, 'not_found', 'Contenu introuvable.');
    c.is_pinned = false;
    c.pinned_until = null;
    return HttpResponse.json(c);
  }),
  http.post(
    `${API}/v1/staff/news/:id/unpublish/`,
    async ({ params, request }) => {
      const c = contenus.find((x) => x.id === params.id);
      if (!c) return erreur(404, 'not_found', 'Contenu introuvable.');
      const { reason = '' } = (await request.json()) as { reason?: string };
      c.status = 'unpublished';
      c.unpublish_reason = reason;
      c.is_pinned = false;
      c.pinned_until = null;
      return HttpResponse.json(c);
    },
  ),
];

// --- Agenda (/v1/staff/agenda/) --------------------------------------------------------

type Evenement = Record<string, unknown> & {
  id: number;
  is_cancelled: boolean;
};

const evenement = (
  id: number,
  title: string,
  o: Partial<Evenement> = {},
): Evenement => ({
  id,
  title,
  description: '',
  event_type: 'other',
  start_at: '2026-10-04T09:00:00+00:00',
  end_at: '2026-10-04T12:00:00+00:00',
  location: 'Salle paroissiale',
  node_id: NOEUD_SAINT_DOMINIQUE,
  node_name: 'Saint-Dominique',
  place_id: null,
  max_participants: 40,
  registration_closes_at: null,
  registrations_count: 12,
  seats_taken: 18,
  seats_remaining: 22,
  is_full: false,
  registrations_open: true,
  is_registered: false,
  my_seats: null,
  my_note: null,
  is_cancelled: false,
  ...o,
});

const evenementsInitiaux = (): Evenement[] => [
  evenement(41, 'Journée des familles'),
  evenement(42, 'Retraite des confirmands', {
    event_type: 'retreat',
    max_participants: null,
    seats_remaining: null,
  }),
];

let evenements = evenementsInitiaux();

const staffAgendaHandlers = [
  http.get(`${API}/v1/staff/agenda/`, ({ request }) =>
    HttpResponse.json(page(evenements, request)),
  ),
  http.post(`${API}/v1/staff/agenda/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const e = evenement(100 + evenements.length, String(body.title), {
      event_type: String(body.event_type),
      location: String(body.location ?? ''),
      start_at: String(body.start_at),
      end_at: String(body.end_at),
      max_participants: (body.max_participants as number) ?? null,
      registrations_count: 0,
      seats_taken: 0,
    });
    evenements.push(e);
    return HttpResponse.json(e, { status: 201 });
  }),
  http.delete(`${API}/v1/staff/agenda/:id/`, ({ params }) => {
    const e = evenements.find((x) => x.id === Number(params.id));
    if (!e) return erreur(404, 'not_found', 'Événement introuvable.');
    e.is_cancelled = true;
    e.registrations_open = false;
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(`${API}/v1/staff/agenda/:id/registrations/`, ({ request }) =>
    HttpResponse.json(
      page(
        [
          {
            id: 1,
            user_id: '0c7b0000-0000-4000-8000-000000000001',
            full_name: 'Marie-Thérèse Diouf',
            email: 'marie-therese.diouf@example.sn',
            seats: 3,
            note: '',
            registered_at: '2026-09-20T10:00:00+00:00',
          },
        ],
        request,
        50,
      ),
    ),
  ),
];

// --- Tableaux de bord (/v1/dashboards/) ------------------------------------------------------

export const tableauNoeudDemo = (nodeId: string, period: number) => ({
  node: {
    id: nodeId,
    name:
      nodeId === NOEUD_ARCHIDIOCESE
        ? 'Archidiocèse de Dakar'
        : 'Saint-Dominique',
    type: nodeId === NOEUD_ARCHIDIOCESE ? 'diocese' : 'paroisse',
  },
  period_days: period,
  generated_at: '2026-09-27T10:00:00+00:00',
  fideles: { attached: 1840, active: 612, new: 37 },
  annonces: { published: 9, reads: 2310, reads_per_article: 256.7 },
  evenements: { upcoming: 4, registrations: 58 },
  actes: {
    counts: {
      submitted: 3,
      under_verification: 2,
      info_requested: 1,
      ready_for_pickup: 4,
      collected: 21,
      rejected: 1,
      cancelled: 0,
    },
    total: 32,
    received: 11,
    median_days_to_collect: 6,
    overdue: 1,
  },
  messagerie: {
    conversations: 14,
    median_first_reply_hours: 5.5,
    unanswered_48h: 1,
  },
  confessions: {
    slots_offered: 24,
    booked: 17,
    honoured: 15,
    absent: 1,
    cancelled: 1,
    upcoming_booked: 6,
  },
});

const dashboardsHandlers = [
  http.get(`${API}/v1/dashboards/nodes/:id/`, ({ params, request }) =>
    HttpResponse.json(
      tableauNoeudDemo(
        String(params.id),
        Number(new URL(request.url).searchParams.get('period') ?? 30),
      ),
    ),
  ),
  http.get(`${API}/v1/dashboards/platform/`, () =>
    HttpResponse.json({
      generated_at: '2026-09-27T10:00:00+00:00',
      accounts: { total: 12480, active_30d: 5210, new_30d: 640 },
      staff: { total: 310, with_mfa_30d: 288, mfa_share: 0.929 },
      health: {
        emails_failed_7d: 3,
        document_requests_overdue: 17,
        beat_stale: 0,
      },
      beat: [
        {
          name: 'Rappels des confessions',
          task: 'apps.confessions.tasks.reminders',
          enabled: true,
          last_run_at: '2026-09-27T06:00:00+00:00',
          stale: false,
        },
      ],
    }),
  ),
];

export const resetStaffMocks = () => {
  actes = actesInitiaux();
  notes = {};
  contenus = contenusInitiaux();
  evenements = evenementsInitiaux();
};

export const staffHandlers = [
  ...staffDocumentsHandlers,
  ...staffNewsHandlers,
  ...staffAgendaHandlers,
  ...dashboardsHandlers,
];

export { NOEUD_ARCHIDIOCESE, NOEUD_SAINT_DOMINIQUE };
