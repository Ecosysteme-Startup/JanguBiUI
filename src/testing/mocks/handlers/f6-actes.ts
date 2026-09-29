import { http, HttpResponse } from 'msw';

import { apiUrl } from '@/testing/mocks/api-url';
import { ids, parishes } from '@/testing/mocks/db';
import {
  actesState,
  type MockActe,
  ORIGINAL_NOTICE,
  REASON_LABELS_MOCK,
  STATUS_LABELS,
  TEAM,
  teamName,
  TYPE_LABELS,
} from '@/testing/mocks/db-f6-actes';

/** Cycle SRS §8.1, comme `TRANSITIONS` dans apps/documents/services.py. */
const TRANSITIONS: Record<string, { from: string[]; to: string }> = {
  'start-verification': { from: ['submitted'], to: 'under_verification' },
  'request-info': { from: ['under_verification'], to: 'info_requested' },
  'mark-ready': { from: ['under_verification'], to: 'ready_for_pickup' },
  'mark-collected': { from: ['ready_for_pickup'], to: 'collected' },
  reject: { from: ['under_verification'], to: 'rejected' },
};

const pickupOf = (r: MockActe) => ({
  mode: r.pickup_mode,
  place_name: r.pickup_place?.name ?? null,
  place_address: r.pickup_place?.address ?? null,
  hours: r.pickup_hours,
  message: r.pickup_message,
  original_notice: ORIGINAL_NOTICE,
});

const OPEN = ['submitted', 'under_verification', 'info_requested'];
const INDICATIVE_DAYS = 7;
const estimate = (r: MockActe) => {
  if (!OPEN.includes(r.status)) return null;
  const d = new Date(r.created_at);
  d.setUTCDate(d.getUTCDate() + INDICATIVE_DAYS);
  return d.toISOString().slice(0, 10);
};

/** Historique vu du fidèle : jamais le nom des membres de l'équipe. */
const plainLog = ({ from_status, to_status, comment, created_at }: MockActe['history'][number]) => ({ from_status, to_status, comment, created_at });

/** RequesterOutputSerializer : ni notes internes ni registre. */
const requesterView = (r: MockActe, withHistory = true) => ({
  id: r.id,
  reference: r.reference,
  document_type: r.document_type,
  document_type_label: r.document_type_label,
  document_type_free: r.document_type_free,
  reason: r.reason,
  reason_label: REASON_LABELS_MOCK[r.reason] ?? r.reason,
  reason_free: r.reason_free,
  status: r.status,
  status_label: STATUS_LABELS[r.status],
  target_node: r.target_node,
  requester_last_name: r.requester_last_name,
  requester_first_names: r.requester_first_names,
  date_of_birth: r.date_of_birth,
  place_of_birth: r.place_of_birth,
  contact_phone: r.contact_phone,
  contact_email: r.contact_email,
  registered_last_name: r.registered_last_name,
  registered_first_names: r.registered_first_names,
  father_last_name: r.father_last_name,
  mother_last_name: r.mother_last_name,
  sacrament_approximate_date: r.sacrament_approximate_date,
  sacrament_location: r.sacrament_location,
  additional_info: r.additional_info,
  document_details: r.document_details,
  rejection_reason: r.rejection_reason,
  pickup: r.status === 'ready_for_pickup' ? pickupOf(r) : null,
  history: withHistory ? r.history.map(plainLog) : [],
  can_cancel: r.status === 'submitted' || r.status === 'info_requested',
  indicative_days: INDICATIVE_DAYS,
  estimated_ready_on: estimate(r),
  created_at: r.created_at,
  updated_at: r.updated_at,
  closed_at: r.closed_at,
});

export const processorView = (r: MockActe) => ({
  ...requesterView(r),
  pickup: pickupOf(r),
  history: r.history.map((h) => ({ changed_by_id: null, changed_by_name: '', by_requester: false, ...h })),
  register: r.register,
  assigned_to_id: r.assigned_to_id,
  assigned_to_name: teamName(r.assigned_to_id),
  pickup_mode: r.pickup_mode,
  attachments: r.attachments.map((a) => ({
    ...a,
    url: `http://localhost:8001/api/v1/staff/documents/${r.id}/attachments/${a.id}/?token=jeton-de-test`,
    expires_at: '2099-01-01T00:00:00+00:00',
  })),
});

const queueItem = (r: MockActe) => ({
  id: r.id,
  reference: r.reference,
  document_type: r.document_type,
  document_type_label: r.document_type_label,
  reason: r.reason,
  reason_label: REASON_LABELS_MOCK[r.reason] ?? r.reason,
  reason_free: r.reason_free,
  status: r.status,
  status_label: STATUS_LABELS[r.status],
  target_node: r.target_node,
  requester_name: `${r.requester_last_name} ${r.requester_first_names}`,
  assigned_to_id: r.assigned_to_id,
  assigned_to_name: teamName(r.assigned_to_id),
  age_days: r.age_days,
  is_overdue: r.is_overdue,
  created_at: r.created_at,
  updated_at: r.updated_at,
});

const page = <T,>(items: T[], url: URL) => {
  const limit = Number(url.searchParams.get('limit') ?? '10');
  const offset = Number(url.searchParams.get('offset') ?? '0');
  return { count: items.length, next: null, previous: null, results: items.slice(offset, offset + limit) };
};

const find = (id: unknown) => actesState.requests.find((r) => r.id === id);
const notFound = () => HttpResponse.json({ message: 'Demande introuvable.' }, { status: 404 });
const now = () => '2026-09-25T09:00:00+00:00';
const ME = TEAM[0].id;

const move = (r: MockActe, to: string, comment = '') => {
  r.history = [...r.history, { from_status: r.status, to_status: to, comment, created_at: now(), changed_by_name: teamName(ME) ?? '', by_requester: false }];
  r.status = to;
  r.updated_at = now();
  if (['collected', 'rejected', 'cancelled'].includes(to)) r.closed_at = now();
};

/** Places de la paroisse du sacrement de démonstration. */
const places = [
  { id: 11, node_id: parishes[2].id, name: 'Église Sainte-Thérèse', kind: 'eglise', is_main: true, address: 'Grand-Dakar', city: 'Dakar' },
];

export const actesHandlers = [
  // --- Fidèle -----------------------------------------------------------------------------
  http.get(apiUrl('/documents/requests/options/'), () =>
    HttpResponse.json({
      document_types: [
        { value: 'baptism', label: TYPE_LABELS.baptism, requires_precision: false, allowed_reasons: ['religious_marriage', 'godparent', 'catechism', 'parish_file', 'personal', 'other'] },
        { value: 'first_communion', label: TYPE_LABELS.first_communion, requires_precision: false, allowed_reasons: ['catechism', 'parish_file', 'personal', 'other'] },
        { value: 'confirmation', label: TYPE_LABELS.confirmation, requires_precision: false, allowed_reasons: ['religious_marriage', 'godparent', 'parish_file', 'personal', 'other'] },
        { value: 'religious_marriage', label: TYPE_LABELS.religious_marriage, requires_precision: false, allowed_reasons: ['parish_file', 'personal', 'other'] },
        { value: 'godparent', label: TYPE_LABELS.godparent, requires_precision: false, allowed_reasons: ['parish_file', 'personal', 'other'] },
        { value: 'other', label: TYPE_LABELS.other, requires_precision: true, allowed_reasons: ['religious_marriage', 'godparent', 'catechism', 'parish_file', 'personal', 'other'] },
      ],
      reasons: [
        { value: 'religious_marriage', label: 'Mariage religieux' },
        { value: 'godparent', label: 'Parrain / marraine' },
        { value: 'catechism', label: 'Inscription catéchèse' },
        { value: 'parish_file', label: 'Dossier paroissial' },
        { value: 'personal', label: 'Usage personnel' },
        { value: 'other', label: 'Autre' },
      ],
      pickup_modes: [
        { value: 'secretariat', label: 'Au secrétariat de la paroisse du sacrement' },
        { value: 'transfer_to_followed_parish', label: 'Transmis à ma paroisse' },
      ],
    }),
  ),
  http.get(apiUrl('/documents/requests/'), ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const mine = actesState.requests.filter((r) => r.mine && (!status || r.status === status));
    return HttpResponse.json(page(mine.map((r) => requesterView(r, false)), url));
  }),
  http.post(apiUrl('/documents/requests/'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    actesState.lastCreate = body;
    if (!body.consent_given) return HttpResponse.json({ message: 'Le consentement est nécessaire pour transmettre la demande.' }, { status: 400 });
    const target = parishes.find((p) => p.id === body.target_node_id);
    if (!target) return HttpResponse.json({ message: 'Choisissez la paroisse où le sacrement a été célébré.' }, { status: 400 });
    const created: MockActe = {
      ...actesState.requests[0],
      id: 'd0c00000-0000-4000-8000-0000000000ff',
      reference: 'DOC-20260925-A1B2C3',
      status: 'submitted',
      status_label: 'Soumise',
      document_type: String(body.document_type),
      document_type_label: TYPE_LABELS[String(body.document_type)],
      reason: String(body.reason),
      target_node: { id: target.id, name: target.name },
      history: [{ from_status: '', to_status: 'submitted', comment: '', created_at: now() }],
      created_at: now(),
      updated_at: now(),
    };
    actesState.requests = [created, ...actesState.requests];
    return HttpResponse.json(requesterView(created), { status: 201 });
  }),
  http.get(apiUrl('/documents/requests/:id/'), ({ params }) => {
    const r = find(params.id);
    return r?.mine ? HttpResponse.json(requesterView(r)) : notFound();
  }),
  http.post(apiUrl('/documents/requests/:id/supplement/'), async ({ params, request }) => {
    const r = find(params.id);
    if (!r?.mine) return notFound();
    const body = (await request.json()) as { additional_info?: string; attachment_file_id?: number | null };
    actesState.lastSupplement = body;
    if (r.status !== 'info_requested') return HttpResponse.json({ message: 'Action « supplement » impossible.' }, { status: 400 });
    if (!body.additional_info?.trim() && !body.attachment_file_id) return HttpResponse.json({ message: 'Le complément est vide.' }, { status: 400 });
    move(r, 'under_verification', 'Complément fourni par le demandeur.');
    r.additional_info = `${r.additional_info}\n\n[Complément]\n${body.additional_info ?? ''}`.trim();
    return HttpResponse.json(requesterView(r));
  }),
  http.post(apiUrl('/documents/requests/:id/cancel/'), ({ params }) => {
    const r = find(params.id);
    if (!r?.mine) return notFound();
    if (!['submitted', 'info_requested'].includes(r.status)) return HttpResponse.json({ message: 'Action « cancel » impossible.' }, { status: 400 });
    move(r, 'cancelled');
    return HttpResponse.json(requesterView(r, false));
  }),
  http.post(apiUrl('/files/upload/standard/'), () => {
    actesState.uploads += 1;
    return HttpResponse.json({ id: 900 + actesState.uploads }, { status: 201 });
  }),

  // --- Paroisse ---------------------------------------------------------------------------
  http.get(apiUrl('/staff/documents/counts/'), () => {
    const counts: Record<string, number> = Object.fromEntries(Object.keys(STATUS_LABELS).map((s) => [s, 0]));
    actesState.requests.forEach((r) => (counts[r.status] += 1));
    return HttpResponse.json({ counts, total: actesState.requests.length });
  }),
  http.get(apiUrl('/staff/documents/'), ({ request }) => {
    const url = new URL(request.url);
    const p = url.searchParams;
    const q = (p.get('search') ?? '').toLowerCase();
    const rows = actesState.requests.filter(
      (r) =>
        (!p.get('status') || r.status === p.get('status')) &&
        (!p.get('document_type') || r.document_type === p.get('document_type')) &&
        (p.get('overdue') !== 'true' || r.is_overdue) &&
        (!p.get('reason') || r.reason === p.get('reason')) &&
        (!p.get('assignee') ||
          (p.get('assignee') === 'me' ? r.assigned_to_id === ME : p.get('assignee') === 'none' ? !r.assigned_to_id : r.assigned_to_id === p.get('assignee'))) &&
        (!p.get('received_from') || r.created_at.slice(0, 10) >= String(p.get('received_from'))) &&
        (!p.get('received_to') || r.created_at.slice(0, 10) <= String(p.get('received_to'))) &&
        (!q || `${r.reference} ${r.requester_last_name} ${r.requester_first_names}`.toLowerCase().includes(q)),
    );
    return HttpResponse.json(page(rows.map(queueItem), url));
  }),
  http.get(apiUrl('/staff/documents/:id/notes/'), ({ params }) => (find(params.id) ? HttpResponse.json(actesState.notes[String(params.id)] ?? []) : notFound())),
  http.post(apiUrl('/staff/documents/:id/notes/'), async ({ params, request }) => {
    if (!find(params.id)) return notFound();
    const { content } = (await request.json()) as { content: string };
    const note = { id: Date.now(), author_id: ME, author_name: teamName(ME) ?? '', content, created_at: now() };
    actesState.notes[String(params.id)] = [...(actesState.notes[String(params.id)] ?? []), note];
    return HttpResponse.json(note, { status: 201 });
  }),
  http.put(apiUrl('/staff/documents/:id/register-ref/'), async ({ params, request }) => {
    const r = find(params.id);
    if (!r) return notFound();
    const b = (await request.json()) as Record<string, string>;
    r.register = { volume: b.register_volume ?? '', page: b.register_page ?? '', number: b.register_number ?? '', marginal_notes: b.register_marginal_notes ?? '' };
    return HttpResponse.json(processorView(r));
  }),
  http.get(apiUrl('/staff/documents/:id/assignees/'), ({ params }) => (find(params.id) ? HttpResponse.json(TEAM) : notFound())),
  http.post(apiUrl('/staff/documents/:id/assign/'), async ({ params, request }) => {
    const r = find(params.id);
    if (!r) return notFound();
    const body = (await request.json()) as { assignee_id?: string | null };
    actesState.lastAssign = { id: r.id, body };
    if (body.assignee_id === undefined) return HttpResponse.json({ message: 'Les données envoyées sont invalides.' }, { status: 400 });
    if (body.assignee_id && !teamName(body.assignee_id))
      return HttpResponse.json({ message: 'Cette personne ne traite pas les demandes d’actes de cette paroisse.' }, { status: 400 });
    r.assigned_to_id = body.assignee_id;
    return HttpResponse.json(processorView(r));
  }),
  http.get(apiUrl('/staff/documents/:id/'), ({ params }) => {
    const r = find(params.id);
    return r ? HttpResponse.json(processorView(r)) : notFound();
  }),
  http.post(apiUrl('/staff/documents/:id/:transition/'), async ({ params, request }) => {
    const r = find(params.id);
    if (!r) return notFound();
    const transition = String(params.transition);
    const body = (await request.json()) as { message?: string; pickup_hours?: string; pickup_place_id?: number | null };
    actesState.lastTransition = { id: r.id, transition, body };
    const rule = TRANSITIONS[transition];
    if (!rule) return HttpResponse.json({ message: 'Action inconnue.' }, { status: 404 });
    if (!rule.from.includes(r.status)) return HttpResponse.json({ message: `Action impossible au statut « ${STATUS_LABELS[r.status]} ».` }, { status: 400 });
    const message = body.message?.trim() ?? '';
    if (transition === 'reject' && !message) return HttpResponse.json({ message: 'Le motif du rejet est obligatoire.' }, { status: 400 });
    if (transition === 'request-info' && !message) return HttpResponse.json({ message: 'Précisez le complément attendu.' }, { status: 400 });
    if (transition === 'reject') r.rejection_reason = message;
    if (transition === 'mark-ready') {
      const place = places.find((pl) => pl.id === body.pickup_place_id);
      r.pickup_place = place ? { name: place.name, address: place.address } : null;
      r.pickup_hours = body.pickup_hours ?? '';
      r.pickup_message = message;
    }
    if (!r.assigned_to_id) r.assigned_to_id = ME;
    move(r, rule.to, message);
    return HttpResponse.json(processorView(r));
  }),
  http.get(apiUrl('/hierarchy/nodes/:nodeId/places/'), ({ params }) =>
    HttpResponse.json(places.filter((pl) => pl.node_id === params.nodeId || params.nodeId === ids.saintDominique)),
  ),
];
