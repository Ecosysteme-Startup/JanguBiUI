import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type { RequesterRequest } from '@/features/documents/types';
import { page } from '@/lib/pagination';

import { networkDelay } from '../utils';

import { PAROISSES } from './paroisses';

// Demandes d'actes — contrat réel apps/documents (RequesterOutput) :
// GET/POST /v1/documents/requests/, GET /v1/documents/requests/<uuid>/,
// POST …/cancel/, POST …/supplement/, GET /v1/documents/requests/options/,
// POST /v1/files/upload/standard/ (pièce jointe → {id}).

const API = `${env.API_URL}/v1`;
const SD = PAROISSES.saintDominique;

const TYPES: Record<string, string> = {
  baptism: 'Certificat de baptême',
  first_communion: 'Attestation de première communion',
  confirmation: 'Attestation de confirmation',
  religious_marriage: 'Attestation de mariage religieux',
  godparent: 'Attestation parrain / marraine',
  other: 'Autre document',
};
const REASONS: Record<string, string> = {
  religious_marriage: 'Mariage religieux',
  godparent: 'Parrain / marraine',
  catechism: 'Inscription catéchèse',
  parish_file: 'Dossier paroissial',
  personal: 'Usage personnel',
  other: 'Autre',
};
const STATUS_LABELS: Record<string, string> = {
  submitted: 'Soumise',
  under_verification: 'En vérification',
  info_requested: 'Complément demandé',
  ready_for_pickup: 'Prête à retirer',
  collected: 'Retirée',
  rejected: 'Refusée',
  cancelled: 'Annulée',
};

export const DOCUMENT_OPTIONS = {
  document_types: [
    {
      value: 'baptism',
      label: TYPES.baptism,
      requires_precision: false,
      allowed_reasons: [
        'religious_marriage',
        'godparent',
        'catechism',
        'parish_file',
        'personal',
        'other',
      ],
    },
    {
      value: 'first_communion',
      label: TYPES.first_communion,
      requires_precision: false,
      allowed_reasons: ['catechism', 'parish_file', 'personal', 'other'],
    },
    {
      value: 'confirmation',
      label: TYPES.confirmation,
      requires_precision: false,
      allowed_reasons: [
        'religious_marriage',
        'godparent',
        'parish_file',
        'personal',
        'other',
      ],
    },
    {
      value: 'religious_marriage',
      label: TYPES.religious_marriage,
      requires_precision: false,
      allowed_reasons: ['parish_file', 'personal', 'other'],
    },
    {
      value: 'godparent',
      label: TYPES.godparent,
      requires_precision: false,
      allowed_reasons: ['parish_file', 'personal', 'other'],
    },
    {
      value: 'other',
      label: TYPES.other,
      requires_precision: true,
      allowed_reasons: [
        'religious_marriage',
        'godparent',
        'catechism',
        'parish_file',
        'personal',
        'other',
      ],
    },
  ],
  reasons: Object.entries(REASONS).map(([value, label]) => ({ value, label })),
  pickup_modes: [
    { value: 'secretariat', label: 'Au secrétariat de la paroisse' },
    { value: 'transfer_to_followed_parish', label: 'Transmis à ma paroisse' },
  ],
};

export const createRequesterRequest = (
  overrides: Partial<RequesterRequest> = {},
): RequesterRequest => {
  const document_type = overrides.document_type ?? 'baptism';
  const reason = overrides.reason ?? 'religious_marriage';
  const status = overrides.status ?? 'submitted';
  return {
    id: '0f1e2d3c-4b5a-4968-8778-695a4b3c2d1e',
    reference: 'DOC-20260921-4F2A1C',
    document_type,
    document_type_label: TYPES[document_type] ?? document_type,
    document_type_free: '',
    reason,
    reason_label: REASONS[reason] ?? reason,
    reason_free: '',
    status,
    status_label: STATUS_LABELS[status] ?? status,
    target_node: { id: SD.id, name: SD.name },
    requester_last_name: 'Diouf',
    requester_first_names: 'Marie-Thérèse',
    date_of_birth: '1988-05-14',
    place_of_birth: 'Dakar',
    contact_phone: '+221774123658',
    contact_email: 'marie-therese.diouf@exemple.sn',
    registered_last_name: '',
    registered_first_names: '',
    father_last_name: 'Diouf',
    mother_last_name: 'Sarr',
    sacrament_approximate_date: 'juin 1988',
    sacrament_location: 'Église Saint-Dominique',
    additional_info: '',
    document_details: {},
    rejection_reason: '',
    pickup: null,
    history: [
      {
        from_status: '',
        to_status: 'submitted',
        comment: '',
        created_at: '2026-09-21T09:12:00Z',
      },
    ],
    can_cancel: status === 'submitted' || status === 'info_requested',
    indicative_days: 7,
    estimated_ready_on: '2026-09-30',
    created_at: '2026-09-21T09:12:00Z',
    updated_at: '2026-09-21T09:12:00Z',
    closed_at: null,
    ...overrides,
  };
};

export const mockDocuments: RequesterRequest[] = [
  createRequesterRequest(),
  createRequesterRequest({
    id: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    reference: 'DOC-20260915-8B31D0',
    document_type: 'confirmation',
    reason: 'godparent',
    status: 'ready_for_pickup',
    estimated_ready_on: null,
    pickup: {
      mode: 'secretariat',
      place_name: 'Secrétariat de Saint-Dominique',
      place_address: 'Point E, Dakar',
      hours: 'Du mardi au samedi, 9 h – 12 h',
      message: 'Munissez-vous d’une pièce d’identité.',
      original_notice:
        'L’acte vous sera remis en original, signé par le curé et revêtu du sceau de la paroisse.',
    },
  }),
  createRequesterRequest({
    id: '2b3c4d5e-6f70-4b8c-9d0e-1f2a3b4c5d6e',
    reference: 'DOC-20260918-C07E55',
    document_type: 'religious_marriage',
    reason: 'parish_file',
    status: 'info_requested',
    history: [
      {
        from_status: '',
        to_status: 'submitted',
        comment: '',
        created_at: '2026-09-18T10:00:00Z',
      },
      {
        from_status: 'submitted',
        to_status: 'info_requested',
        comment: 'Merci de préciser l’année du mariage.',
        created_at: '2026-09-22T15:30:00Z',
      },
    ],
  }),
];

const v1Error = (status: number, code: string, message: string, details = {}) =>
  HttpResponse.json({ error: { code, message, details } }, { status });

export const documentsHandlers = [
  http.get(`${API}/documents/requests/options/`, async () => {
    await networkDelay();
    return HttpResponse.json(DOCUMENT_OPTIONS);
  }),

  http.get(`${API}/documents/requests/`, async ({ request }) => {
    await networkDelay();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = Number(url.searchParams.get('limit') ?? 10);
    const liste = mockDocuments.filter((d) => !status || d.status === status);
    return HttpResponse.json(
      page(liste.slice(0, limit), { limit, count: liste.length }),
    );
  }),

  http.get(`${API}/documents/requests/:id/`, async ({ params }) => {
    await networkDelay();
    const doc = mockDocuments.find((d) => d.id === params.id);
    if (!doc) return v1Error(404, 'not_found', 'Demande introuvable.');
    return HttpResponse.json(doc);
  }),

  http.post(`${API}/documents/requests/`, async ({ request }) => {
    await networkDelay();
    const body = (await request.json()) as Record<string, unknown>;
    if (!body.consent_given)
      return v1Error(
        400,
        'consent_required',
        'Le consentement est nécessaire.',
      );
    const type = String(body.document_type);
    const allowed =
      DOCUMENT_OPTIONS.document_types.find((t) => t.value === type)
        ?.allowed_reasons ?? [];
    if (!allowed.includes(String(body.reason)))
      return v1Error(
        400,
        'reason_not_allowed',
        'Ce motif ne correspond pas au document demandé.',
      );
    const created = createRequesterRequest({
      id: '9f8e7d6c-5b4a-4392-8170-6f5e4d3c2b1a',
      reference: 'DOC-20260929-A1B2C3',
      document_type: type,
      reason: String(body.reason),
      additional_info: String(body.additional_info ?? ''),
      history: [],
    });
    return HttpResponse.json(created, { status: 201 });
  }),

  http.post(`${API}/documents/requests/:id/cancel/`, async ({ params }) => {
    await networkDelay();
    const doc = mockDocuments.find((d) => d.id === params.id);
    if (!doc) return v1Error(404, 'not_found', 'Demande introuvable.');
    if (!doc.can_cancel)
      return v1Error(
        400,
        'invalid_transition',
        'Cette demande ne peut plus être annulée.',
      );
    return HttpResponse.json({
      ...doc,
      status: 'cancelled',
      status_label: STATUS_LABELS.cancelled,
      can_cancel: false,
    });
  }),

  http.post(
    `${API}/documents/requests/:id/supplement/`,
    async ({ params, request }) => {
      await networkDelay();
      const body = (await request.json()) as {
        additional_info?: string;
        attachment_file_id?: number;
      };
      const doc = mockDocuments.find((d) => d.id === params.id);
      if (!doc) return v1Error(404, 'not_found', 'Demande introuvable.');
      if (!body.additional_info && body.attachment_file_id == null)
        return v1Error(400, 'empty_supplement', 'Le complément est vide.');
      return HttpResponse.json({
        ...doc,
        status: 'under_verification',
        status_label: STATUS_LABELS.under_verification,
        additional_info: body.additional_info ?? doc.additional_info,
      });
    },
  ),

  http.post(`${API}/files/upload/standard/`, async () => {
    await networkDelay();
    return HttpResponse.json({ id: 42 }, { status: 201 });
  }),
];
