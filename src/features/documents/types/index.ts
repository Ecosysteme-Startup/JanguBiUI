import { z } from 'zod';

// Statuts réels (apps/documents DocumentRequest.Status).
export const REQUESTER_STATUSES = [
  'submitted',
  'under_verification',
  'info_requested',
  'ready_for_pickup',
  'collected',
  'rejected',
  'cancelled',
] as const;

export const requesterStatusSchema = z.enum(REQUESTER_STATUSES);
export type RequesterStatus = z.infer<typeof requesterStatusSchema>;

// `validated` et `document_deposited` : statuts des anciens écrans staff
// (hors lot fidèle), conservés pour leur typage jusqu'à leur rebranchement.
export const documentStatusSchema = z.enum([
  ...REQUESTER_STATUSES,
  'validated',
  'document_deposited',
]);
export type DocumentStatus = z.infer<typeof documentStatusSchema>;

// ---------------------------------------------------------------- fidèle

const statusLogSchema = z.object({
  from_status: z.string().optional(),
  to_status: z.string(),
  comment: z.string().default(''),
  created_at: z.string().optional(),
});

const pickupSchema = z.object({
  mode: z.string().nullish(),
  place_name: z.string().nullish(),
  place_address: z.string().nullish(),
  hours: z.string().nullish(),
  message: z.string().nullish(),
  original_notice: z.string().nullish(),
});
export type DocumentPickup = z.infer<typeof pickupSchema>;

/** Contrat réel `RequesterOutput` (GET/POST /v1/documents/requests/…). */
export const requesterRequestSchema = z.object({
  id: z.string(),
  reference: z.string(),
  document_type: z.string(),
  document_type_label: z.string(),
  document_type_free: z.string().default(''),
  reason: z.string(),
  reason_label: z.string(),
  reason_free: z.string().default(''),
  status: requesterStatusSchema,
  status_label: z.string(),
  target_node: z.object({ id: z.string(), name: z.string() }).nullable(),
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
  document_details: z.record(z.unknown()).nullable().default({}),
  rejection_reason: z.string().default(''),
  pickup: pickupSchema.nullable(),
  history: z.array(statusLogSchema).default([]),
  can_cancel: z.boolean(),
  indicative_days: z.number(),
  estimated_ready_on: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  closed_at: z.string().nullable(),
});
export type RequesterRequest = z.infer<typeof requesterRequestSchema>;

/** `GET /v1/documents/requests/options/`. */
export const documentOptionsSchema = z.object({
  document_types: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
      requires_precision: z.boolean().default(false),
      allowed_reasons: z.array(z.string()).default([]),
    }),
  ),
  reasons: z.array(z.object({ value: z.string(), label: z.string() })),
  pickup_modes: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .default([]),
});
export type DocumentOptions = z.infer<typeof documentOptionsSchema>;

// ------------------------------------------- anciens écrans staff (hors lot)

export const documentRequestSchema = z.object({
  id: z.string(),
  document_type: z.string(),
  status: documentStatusSchema,
  notes: z.string().nullable().optional(),
  requester_name: z.string().optional(),
  parish_name: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});
export type DocumentRequest = z.infer<typeof documentRequestSchema>;
