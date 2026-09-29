import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Agenda côté staff : `/v1/staff/agenda/` (capacité `evenements.gerer`).
// Contrat : backend apps/agenda/serializers.py (EventOutputSerializer,
// EventCreate/UpdateInputSerializer, RegistrationOutputSerializer).

export const TYPES_EVENEMENT = [
  { value: 'mass', label: 'Messe' },
  { value: 'conference', label: 'Conférence' },
  { value: 'retreat', label: 'Retraite' },
  { value: 'ordination', label: 'Ordination' },
  { value: 'other', label: 'Autre' },
] as const;

export const evenementStaffSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().default(''),
  event_type: z.string(),
  start_at: z.string(),
  end_at: z.string(),
  location: z.string().default(''),
  node_id: z.string().nullable(),
  node_name: z.string().nullable(),
  place_id: z.number().nullable(),
  max_participants: z.number().nullable(),
  registration_closes_at: z.string().nullable(),
  registrations_count: z.number().default(0),
  seats_taken: z.number().default(0),
  seats_remaining: z.number().nullable(),
  is_full: z.boolean(),
  registrations_open: z.boolean(),
  is_cancelled: z.boolean(),
});
export type EvenementStaff = z.infer<typeof evenementStaffSchema>;

const pageSchema = z.object({
  count: z.number(),
  next: z.string().nullish(),
  previous: z.string().nullish(),
  results: z.array(evenementStaffSchema),
});

export const EVENEMENTS_PAR_PAGE = 20;

export type FiltresEvenements = {
  node?: string;
  include_past?: boolean;
  offset?: number;
};

const params = (f: FiltresEvenements) => ({
  node: f.node || undefined,
  include_past: f.include_past || undefined,
  limit: EVENEMENTS_PAR_PAGE,
  offset: f.offset ?? 0,
});

export const useEvenementsStaff = (f: FiltresEvenements, enabled = true) =>
  useQuery({
    queryKey: ['staff-agenda', 'liste', params(f)],
    queryFn: async () =>
      pageSchema.parse(
        await api.get<unknown>('/v1/staff/agenda/', {
          params: params(f),
          quiet: true,
        }),
      ),
    placeholderData: keepPreviousData,
    enabled,
  });

export type EvenementInput = {
  node_id: string;
  title: string;
  description?: string;
  event_type: string;
  start_at: string;
  end_at: string;
  location?: string;
  max_participants?: number | null;
  registration_closes_at?: string | null;
};

export const useCreerEvenement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: EvenementInput) =>
      evenementStaffSchema.parse(
        await api.post<unknown>('/v1/staff/agenda/', data),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-agenda'] }),
  });
};

/** Annulation : `DELETE /v1/staff/agenda/{id}/` (les inscrits sont prévenus). */
export const useAnnulerEvenement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<null>(`/v1/staff/agenda/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-agenda'] }),
  });
};

export const inscriptionSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  full_name: z.string(),
  email: z.string(),
  seats: z.number(),
  note: z.string().default(''),
  registered_at: z.string(),
});
export type Inscription = z.infer<typeof inscriptionSchema>;

export const useInscriptions = (id: number | null) =>
  useQuery({
    queryKey: ['staff-agenda', 'inscriptions', id],
    queryFn: async () =>
      z
        .object({ count: z.number(), results: z.array(inscriptionSchema) })
        .parse(
          await api.get<unknown>(`/v1/staff/agenda/${id}/registrations/`, {
            params: { limit: 50 },
            quiet: true,
          }),
        ),
    enabled: id !== null,
  });
