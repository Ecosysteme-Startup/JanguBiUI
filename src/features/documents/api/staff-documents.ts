import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Demandes d'actes côté paroisse : `/v1/staff/documents/` (capacité
// `actes.traiter`, MFA). Contrat : backend apps/documents/serializers.py
// (QueueItemSerializer, ProcessorOutputSerializer). Pagination limit/offset.

export const STATUTS_ACTE = [
  'submitted',
  'under_verification',
  'info_requested',
  'ready_for_pickup',
  'collected',
  'rejected',
  'cancelled',
] as const;
export type StatutActe = (typeof STATUTS_ACTE)[number];

export const LIBELLES_STATUT: Record<StatutActe, string> = {
  submitted: 'Soumise',
  under_verification: 'En vérification',
  info_requested: 'Complément demandé',
  ready_for_pickup: 'Prête à retirer',
  collected: 'Retirée',
  rejected: 'Rejetée',
  cancelled: 'Annulée',
};

const noeudRef = z.object({ id: z.string(), name: z.string() }).nullable();

export const acteFileSchema = z.object({
  id: z.string(),
  reference: z.string(),
  document_type: z.string(),
  document_type_label: z.string(),
  reason: z.string().nullish(),
  reason_label: z.string().nullish(),
  reason_free: z.string().nullish(),
  status: z.string(),
  status_label: z.string(),
  target_node: noeudRef,
  requester_name: z.string(),
  assigned_to_id: z.string().nullable(),
  assigned_to_name: z.string().nullable(),
  age_days: z.number(),
  is_overdue: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ActeFile = z.infer<typeof acteFileSchema>;

const pageSchema = z.object({
  count: z.number(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  next: z.string().nullish(),
  previous: z.string().nullish(),
  results: z.array(acteFileSchema),
});
export type PageActes = z.infer<typeof pageSchema>;

export const ACTES_PAR_PAGE = 20;

export type FiltresActes = {
  node?: string;
  status?: string;
  search?: string;
  overdue?: boolean;
  assignee?: 'me' | 'none';
  offset?: number;
};

const nettoyer = (f: FiltresActes) => ({
  node: f.node || undefined,
  status: f.status || undefined,
  search: f.search?.trim() || undefined,
  overdue: f.overdue || undefined,
  assignee: f.assignee || undefined,
  limit: ACTES_PAR_PAGE,
  offset: f.offset ?? 0,
});

export const getFileActes = async (f: FiltresActes): Promise<PageActes> =>
  pageSchema.parse(
    await api.get<unknown>('/v1/staff/documents/', {
      params: nettoyer(f),
      quiet: true,
    }),
  );

export const fileActesQuery = (f: FiltresActes) =>
  queryOptions({
    queryKey: ['staff-documents', 'file', nettoyer(f)],
    queryFn: () => getFileActes(f),
    placeholderData: keepPreviousData,
  });

export const useFileActes = (f: FiltresActes, enabled = true) =>
  useQuery({ ...fileActesQuery(f), enabled });

const comptesSchema = z.object({
  counts: z.record(z.string(), z.number()),
  total: z.number(),
});
export type ComptesActes = z.infer<typeof comptesSchema>;

/** `GET /v1/staff/documents/counts/?node=` : compte par statut (onglets). */
export const useComptesActes = (node?: string, enabled = true) =>
  useQuery({
    queryKey: ['staff-documents', 'counts', node ?? null],
    queryFn: async () =>
      comptesSchema.parse(
        await api.get<unknown>('/v1/staff/documents/counts/', {
          params: { node },
          quiet: true,
        }),
      ),
    enabled,
  });

// --- Détail -------------------------------------------------------------------

const historiqueSchema = z.object({
  from_status: z.string().nullish(),
  to_status: z.string(),
  comment: z.string().nullish(),
  created_at: z.string(),
  changed_by_id: z.string().nullish(),
  changed_by_name: z.string().nullish(),
  by_requester: z.boolean().optional(),
});

const pieceSchema = z.object({
  id: z.number(),
  name: z.string(),
  content_type: z.string(),
  size: z.number().nullable(),
  uploaded_at: z.string(),
  url: z.string(),
  expires_at: z.string(),
});

export const acteDetailSchema = z.object({
  id: z.string(),
  reference: z.string(),
  document_type: z.string(),
  document_type_label: z.string(),
  document_type_free: z.string().nullish(),
  reason_label: z.string().nullish(),
  reason_free: z.string().nullish(),
  status: z.string(),
  status_label: z.string(),
  target_node: noeudRef,
  requester_last_name: z.string().default(''),
  requester_first_names: z.string().default(''),
  date_of_birth: z.string().nullish(),
  place_of_birth: z.string().nullish(),
  contact_phone: z.string().nullish(),
  contact_email: z.string().nullish(),
  registered_last_name: z.string().nullish(),
  registered_first_names: z.string().nullish(),
  father_last_name: z.string().nullish(),
  mother_last_name: z.string().nullish(),
  sacrament_approximate_date: z.string().nullish(),
  sacrament_location: z.string().nullish(),
  additional_info: z.string().nullish(),
  rejection_reason: z.string().nullish(),
  history: z.array(historiqueSchema).default([]),
  indicative_days: z.number().nullish(),
  estimated_ready_on: z.string().nullish(),
  created_at: z.string(),
  closed_at: z.string().nullish(),
  register: z
    .object({
      volume: z.string(),
      page: z.string(),
      number: z.string(),
      marginal_notes: z.string(),
    })
    .nullish(),
  assigned_to_id: z.string().nullish(),
  assigned_to_name: z.string().nullish(),
  attachments: z.array(pieceSchema).default([]),
});
export type ActeDetail = z.infer<typeof acteDetailSchema>;

const cleDetail = (id: string) => ['staff-documents', 'detail', id] as const;

export const useActe = (id: string) =>
  useQuery({
    queryKey: cleDetail(id),
    queryFn: async () =>
      acteDetailSchema.parse(
        await api.get<unknown>(
          `/v1/staff/documents/${encodeURIComponent(id)}/`,
          { quiet: true },
        ),
      ),
    enabled: !!id,
    retry: false,
  });

// --- Transitions ----------------------------------------------------------------

export type TransitionActe =
  | 'start-verification'
  | 'request-info'
  | 'mark-ready'
  | 'mark-collected'
  | 'reject';

/** Transitions proposées selon le statut (la machine d'état reste au back). */
export const TRANSITIONS_PAR_STATUT: Record<string, TransitionActe[]> = {
  submitted: ['start-verification', 'request-info', 'reject'],
  under_verification: ['mark-ready', 'request-info', 'reject'],
  info_requested: ['start-verification', 'reject'],
  ready_for_pickup: ['mark-collected'],
};

export const LIBELLES_TRANSITION: Record<TransitionActe, string> = {
  'start-verification': 'Commencer la vérification',
  'request-info': 'Demander un complément',
  'mark-ready': 'Marquer prête à retirer',
  'mark-collected': 'Marquer retirée',
  reject: 'Rejeter',
};

/** Transitions dont le message est obligatoire. */
export const MESSAGE_REQUIS: TransitionActe[] = ['request-info', 'reject'];

export const useTransitionActe = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      transition,
      message = '',
    }: {
      transition: TransitionActe;
      message?: string;
    }) =>
      acteDetailSchema.parse(
        await api.post<unknown>(
          `/v1/staff/documents/${encodeURIComponent(id)}/${transition}/`,
          { message },
        ),
      ),
    onSuccess: (acte) => {
      qc.setQueryData(cleDetail(id), acte);
      qc.invalidateQueries({ queryKey: ['staff-documents', 'file'] });
      qc.invalidateQueries({ queryKey: ['staff-documents', 'counts'] });
    },
  });
};

// --- Notes internes ---------------------------------------------------------------

const noteSchema = z.object({
  id: z.number(),
  author_id: z.string().nullish(),
  author_name: z.string(),
  content: z.string(),
  created_at: z.string(),
});
export type NoteActe = z.infer<typeof noteSchema>;

export const useNotesActe = (id: string) =>
  useQuery({
    queryKey: ['staff-documents', 'notes', id],
    queryFn: async () =>
      z
        .array(noteSchema)
        .parse(
          await api.get<unknown>(
            `/v1/staff/documents/${encodeURIComponent(id)}/notes/`,
            { quiet: true },
          ),
        ),
    enabled: !!id,
  });

export const useAjouterNote = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) =>
      noteSchema.parse(
        await api.post<unknown>(
          `/v1/staff/documents/${encodeURIComponent(id)}/notes/`,
          { content },
        ),
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['staff-documents', 'notes', id] }),
  });
};

// --- Attribution ---------------------------------------------------------------------

const assigneSchema = z.object({ id: z.string(), full_name: z.string() });

export const useAssignables = (id: string) =>
  useQuery({
    queryKey: ['staff-documents', 'assignees', id],
    queryFn: async () =>
      z
        .array(assigneSchema)
        .parse(
          await api.get<unknown>(
            `/v1/staff/documents/${encodeURIComponent(id)}/assignees/`,
            { quiet: true },
          ),
        ),
    enabled: !!id,
  });

export const useAttribuer = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignee_id: string | null) =>
      acteDetailSchema.parse(
        await api.post<unknown>(
          `/v1/staff/documents/${encodeURIComponent(id)}/assign/`,
          { assignee_id },
        ),
      ),
    onSuccess: (acte) => {
      qc.setQueryData(cleDetail(id), acte);
      qc.invalidateQueries({ queryKey: ['staff-documents', 'file'] });
    },
  });
};
