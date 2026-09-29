import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Lieux de culte, semaine type et exceptions : `/v1/hierarchy/nodes/{id}/places/`,
// `/v1/hierarchy/places/{id}/schedule|exceptions/`. Lieux : structure.gerer ;
// horaires et exceptions : horaires.gerer.

export const lieuSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  name: z.string(),
  kind: z.string(),
  is_main: z.boolean(),
  address: z.string().default(''),
  city: z.string().default(''),
  is_active: z.boolean(),
});
export type Lieu = z.infer<typeof lieuSchema>;

export const LIBELLES_LIEU: Record<string, string> = {
  eglise_paroissiale: 'Église paroissiale',
  succursale: 'Succursale',
  chapelle: 'Chapelle',
  station: 'Station',
  sanctuaire: 'Sanctuaire',
};

export const JOURS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];

export const LIBELLES_HORAIRE: Record<string, string> = {
  messe: 'Messe',
  confession: 'Confession',
  adoration: 'Adoration',
};

export const horaireSchema = z.object({
  id: z.number().optional(),
  kind: z.string(),
  weekday: z.number(),
  start_time: z.string(),
  end_time: z.string().nullable().optional(),
  language: z.string().default(''),
  note: z.string().default(''),
  valid_from: z.string().nullable().optional(),
  valid_to: z.string().nullable().optional(),
});
export type Horaire = z.infer<typeof horaireSchema>;

export const exceptionSchema = z.object({
  id: z.number(),
  date: z.string(),
  kind: z.string(),
  cancelled: z.boolean(),
  start_time: z.string().nullable(),
  end_time: z.string().nullable(),
  note: z.string().default(''),
});
export type ExceptionHoraire = z.infer<typeof exceptionSchema>;

export const useLieux = (nodeId: string | undefined) =>
  useQuery({
    queryKey: ['hierarchy', 'places', nodeId],
    queryFn: async () =>
      z
        .array(lieuSchema)
        .parse(
          await api.get<unknown>(`/v1/hierarchy/nodes/${nodeId}/places/`, {
            quiet: true,
          }),
        ),
    enabled: !!nodeId,
  });

export const useCreerLieu = (nodeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; kind: string; city?: string }) =>
      lieuSchema.parse(
        await api.post<unknown>(`/v1/hierarchy/nodes/${nodeId}/places/`, data),
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['hierarchy', 'places', nodeId] }),
  });
};

export const useHoraires = (placeId: number | null) =>
  useQuery({
    queryKey: ['hierarchy', 'schedule', placeId],
    queryFn: async () =>
      z
        .array(horaireSchema)
        .parse(
          await api.get<unknown>(`/v1/hierarchy/places/${placeId}/schedule/`, {
            quiet: true,
          }),
        ),
    enabled: placeId !== null,
  });

/** Remplace la semaine type complète (`PUT …/schedule/`). */
export const useEnregistrerHoraires = (placeId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Horaire[]) =>
      z.array(horaireSchema).parse(
        await api.put<unknown>(`/v1/hierarchy/places/${placeId}/schedule/`, {
          items: items.map((h) => {
            const sansId: Partial<Horaire> = { ...h };
            delete sansId.id;
            return { ...sansId, end_time: h.end_time || null };
          }),
        }),
      ),
    onSuccess: (data) =>
      qc.setQueryData(['hierarchy', 'schedule', placeId], data),
  });
};

export const useExceptions = (placeId: number | null) =>
  useQuery({
    queryKey: ['hierarchy', 'exceptions', placeId],
    queryFn: async () =>
      z
        .array(exceptionSchema)
        .parse(
          await api.get<unknown>(
            `/v1/hierarchy/places/${placeId}/exceptions/`,
            { quiet: true },
          ),
        ),
    enabled: placeId !== null,
  });

export const useAjouterException = (placeId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      date: string;
      kind: string;
      cancelled: boolean;
      start_time?: string | null;
      note?: string;
    }) =>
      exceptionSchema.parse(
        await api.post<unknown>(
          `/v1/hierarchy/places/${placeId}/exceptions/`,
          data,
        ),
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['hierarchy', 'exceptions', placeId] }),
  });
};

export const useSupprimerException = (placeId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.delete<null>(`/v1/hierarchy/places/${placeId}/exceptions/${id}/`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['hierarchy', 'exceptions', placeId] }),
  });
};
