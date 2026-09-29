import { z } from 'zod';

import type { RequestStatus } from '@/components/signature/status-dot';
import type { components } from '@/types/api';
import type { Expect, Matches } from '@/types/api-contract';

export const REQUEST_STATUSES = [
  'submitted',
  'under_verification',
  'info_requested',
  'ready_for_pickup',
  'collected',
  'rejected',
  'cancelled',
] as const satisfies readonly RequestStatus[];

type _StatusesMatchContract = Expect<Matches<(typeof REQUEST_STATUSES)[number], components['schemas']['DocumentRequestStatusEnum']>>;

export const requestStatusSchema = z.enum(REQUEST_STATUSES);

const historyEntrySchema = z.object({
  from_status: z.string().default(''),
  to_status: z.string(),
  comment: z.string().default(''),
  created_at: z.string(),
});
export type HistoryEntry = z.infer<typeof historyEntrySchema>;

const pickupSchema = z.object({
  mode: z.string(),
  place_name: z.string().nullable(),
  place_address: z.string().nullable(),
  hours: z.string(),
  message: z.string(),
  original_notice: z.string(),
});
export type Pickup = z.infer<typeof pickupSchema>;

/**
 * Vue du fidèle (RequesterOutputSerializer). Le schéma est une liste BLANCHE : tout champ
 * que le serveur renverrait en plus (notes internes, références du registre) est retiré
 * au parsing et ne peut donc jamais s'afficher (EF-ACT-02, -05).
 */
export const requestSchema = z.object({
  id: z.string(),
  reference: z.string(),
  document_type: z.string(),
  document_type_label: z.string(),
  document_type_free: z.string().default(''),
  reason: z.string(),
  reason_label: z.string().default(''),
  reason_free: z.string().default(''),
  status: requestStatusSchema,
  status_label: z.string(),
  target_node: z.object({ id: z.string(), name: z.string() }).nullable(),
  requester_last_name: z.string(),
  requester_first_names: z.string(),
  date_of_birth: z.string(),
  place_of_birth: z.string(),
  contact_phone: z.string(),
  contact_email: z.string(),
  father_last_name: z.string(),
  mother_last_name: z.string(),
  sacrament_approximate_date: z.string(),
  sacrament_location: z.string(),
  additional_info: z.string().default(''),
  document_details: z.record(z.string(), z.unknown()).nullish(),
  rejection_reason: z.string().default(''),
  pickup: pickupSchema.nullable(),
  history: z.array(historyEntrySchema).default([]),
  can_cancel: z.boolean(),
  /** Délai indicatif de la paroisse (jours) et date estimée : indicatifs, jamais un engagement. */
  indicative_days: z.number().nullish(),
  estimated_ready_on: z.string().nullish(),
  created_at: z.string(),
  updated_at: z.string(),
  closed_at: z.string().nullish(),
});
export type DocumentRequest = z.infer<typeof requestSchema>;

export const requestPageSchema = z.object({ count: z.number(), results: z.array(requestSchema) });

/** Libellés des motifs (DocumentRequest.RequestReason) pour les listes ; le formulaire lit l'endpoint « options ». */
export const REASON_LABELS: Record<string, string> = {
  religious_marriage: 'mariage religieux',
  godparent: 'parrainage',
  catechism: 'catéchèse',
  parish_file: 'dossier paroissial',
  personal: 'usage personnel',
  other: 'autre motif',
};

export const reasonLabel = (request: Pick<DocumentRequest, 'reason' | 'reason_free'> & { reason_label?: string }) => {
  if (request.reason === 'other' && request.reason_free) return request.reason_free;
  if (request.reason_label) return request.reason_label.charAt(0).toLowerCase() + request.reason_label.slice(1);
  return REASON_LABELS[request.reason] ?? request.reason;
};

export const documentLabel = (request: Pick<DocumentRequest, 'document_type' | 'document_type_label' | 'document_type_free'>) =>
  request.document_type === 'other' && request.document_type_free ? request.document_type_free : request.document_type_label;
