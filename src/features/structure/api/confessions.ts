import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Confessions côté staff : `/v1/staff/confessions/` — règles et créneaux du
// prêtre (confessions.gerer), planning de 4 semaines (confessions.gerer ou
// confessions.voir_planning, initiales pour le secrétariat).

const lieuBref = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string().default(''),
  node_id: z.string(),
});

export const regleSchema = z.object({
  id: z.number(),
  place: lieuBref,
  weekday: z.number(),
  start_time: z.string(),
  end_time: z.string(),
  slot_minutes: z.number(),
  valid_from: z.string().nullable(),
  valid_to: z.string().nullable(),
  is_active: z.boolean(),
});
export type Regle = z.infer<typeof regleSchema>;

export const creneauSchema = z.object({
  id: z.number(),
  starts_at: z.string(),
  ends_at: z.string(),
  status: z.string(),
  place: lieuBref,
  priest_id: z.string().nullable(),
  priest_name: z.string().nullable().optional(),
  is_mine: z.boolean().default(false),
  booking: z
    .object({ id: z.number(), status: z.string(), person: z.string() })
    .nullable(),
});
export type Creneau = z.infer<typeof creneauSchema>;

export const useRegles = (enabled: boolean) =>
  useQuery({
    queryKey: ['confessions', 'rules'],
    queryFn: async () =>
      z
        .array(regleSchema)
        .parse(
          await api.get<unknown>('/v1/staff/confessions/rules/', { quiet: true }),
        ),
    enabled,
  });

export const useCreerRegle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      place_id: number;
      weekday: number;
      start_time: string;
      end_time: string;
      slot_minutes: number;
    }) =>
      regleSchema.parse(
        await api.post<unknown>('/v1/staff/confessions/rules/', data),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['confessions'] }),
  });
};

export const useSupprimerRegle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.delete<null>(`/v1/staff/confessions/rules/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['confessions'] }),
  });
};

export const usePlanning = (node: string | undefined, dateFrom?: string) =>
  useQuery({
    queryKey: ['confessions', 'planning', node, dateFrom],
    queryFn: async () =>
      z
        .array(creneauSchema)
        .parse(
          await api.get<unknown>('/v1/staff/confessions/planning/', {
            params: { node, date_from: dateFrom },
            quiet: true,
          }),
        ),
    enabled: !!node,
  });

export const useAnnulerCreneau = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message = '' }: { id: number; message?: string }) =>
      api.post<unknown>(`/v1/staff/confessions/slots/${id}/cancel/`, {
        message,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['confessions', 'planning'] }),
  });
};

export const usePresence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, attended }: { id: number; attended: boolean }) =>
      api.post<unknown>(`/v1/staff/confessions/bookings/${id}/attendance/`, {
        attended,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['confessions', 'planning'] }),
  });
};
