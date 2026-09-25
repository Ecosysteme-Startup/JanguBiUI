import { z } from 'zod';

import { REQUEST_STATUS, type RequestStatus } from '@/components/signature/status-dot';

const STATUSES = Object.keys(REQUEST_STATUS) as [RequestStatus, ...RequestStatus[]];
export const statusSchema = z.enum(STATUSES);

const nodeBrief = z.object({ id: z.string(), name: z.string() }).nullable();

export const queueItemSchema = z.object({
  id: z.string(),
  reference: z.string(),
  document_type: z.string(),
  document_type_label: z.string(),
  status: statusSchema,
  status_label: z.string(),
  target_node: nodeBrief,
  requester_name: z.string(),
  assigned_to_id: z.string().nullable(),
  age_days: z.number().nullable(),
  is_overdue: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type QueueItem = z.infer<typeof queueItemSchema>;

export const queuePageSchema = z.object({ count: z.number(), results: z.array(queueItemSchema) });
export type QueuePage = z.infer<typeof queuePageSchema>;

const logSchema = z.object({
  from_status: z.string().default(''),
  to_status: z.string(),
  comment: z.string().default(''),
  created_at: z.string(),
});
export type StatusLog = z.infer<typeof logSchema>;

/** Vue de la paroisse (ProcessorOutputSerializer). */
export const processorRequestSchema = z.object({
  id: z.string(),
  reference: z.string(),
  document_type: z.string(),
  document_type_label: z.string(),
  document_type_free: z.string().default(''),
  reason: z.string(),
  reason_free: z.string().default(''),
  status: statusSchema,
  status_label: z.string(),
  target_node: nodeBrief,
  requester_last_name: z.string(),
  requester_first_names: z.string(),
  date_of_birth: z.string(),
  place_of_birth: z.string(),
  contact_phone: z.string(),
  contact_email: z.string(),
  registered_last_name: z.string().default(''),
  registered_first_names: z.string().default(''),
  father_last_name: z.string(),
  mother_last_name: z.string(),
  sacrament_approximate_date: z.string(),
  sacrament_location: z.string(),
  additional_info: z.string().default(''),
  document_details: z.record(z.string(), z.unknown()).nullish(),
  rejection_reason: z.string().default(''),
  pickup: z
    .object({
      mode: z.string(),
      place_name: z.string().nullable(),
      place_address: z.string().nullable(),
      hours: z.string(),
      message: z.string(),
    })
    .nullable(),
  pickup_mode: z.string().default('secretariat'),
  history: z.array(logSchema).default([]),
  register: z.object({
    volume: z.string().default(''),
    page: z.string().default(''),
    number: z.string().default(''),
    marginal_notes: z.string().default(''),
  }),
  assigned_to_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  closed_at: z.string().nullish(),
});
export type ProcessorRequest = z.infer<typeof processorRequestSchema>;

export const noteSchema = z.object({
  id: z.number(),
  author_id: z.string().nullable(),
  content: z.string(),
  created_at: z.string(),
});
export type InternalNote = z.infer<typeof noteSchema>;

export const REASON_LABELS: Record<string, string> = {
  religious_marriage: 'Mariage religieux',
  godparent: 'Parrainage',
  catechism: 'Catéchèse',
  parish_file: 'Dossier paroissial',
  personal: 'Usage personnel',
  other: 'Autre',
};

export const DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: 'baptism', label: 'Certificat de baptême' },
  { value: 'first_communion', label: 'Attestation de première communion' },
  { value: 'confirmation', label: 'Attestation de confirmation' },
  { value: 'religious_marriage', label: 'Attestation de mariage religieux' },
  { value: 'godparent', label: 'Attestation parrain / marraine' },
  { value: 'other', label: 'Autre document' },
];
