import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Paramètres de la paroisse : secrétariat (`/v1/hierarchy/nodes/{id}/settings/`),
// délais par type d'acte (`/v1/staff/documents/nodes/{id}/type-delays/`) —
// horaires.gerer ou structure.gerer ; disponibilités de messagerie du prêtre
// (`/v1/messaging/availability/`, messagerie.recevoir_fideles).

export const reglagesSchema = z.object({
  id: z.string(),
  address: z.string().default(''),
  city: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().default(''),
  office_hours: z.array(z.object({ days: z.string(), hours: z.string() })),
  secretariat_public: z.boolean(),
  acts_delay_days: z.number().nullable(),
  acts_welcome_message: z.string().default(''),
  updated_at: z.string().optional(),
});
export type Reglages = z.infer<typeof reglagesSchema>;

export const useReglages = (nodeId: string | undefined) =>
  useQuery({
    queryKey: ['parametres', 'settings', nodeId],
    queryFn: async () =>
      reglagesSchema.parse(
        await api.get<unknown>(`/v1/hierarchy/nodes/${nodeId}/settings/`, {
          quiet: true,
        }),
      ),
    enabled: !!nodeId,
  });

export const useEnregistrerReglages = (nodeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Omit<Reglages, 'id' | 'updated_at'>>) =>
      reglagesSchema.parse(
        await api.patch<unknown>(`/v1/hierarchy/nodes/${nodeId}/settings/`, data),
      ),
    onSuccess: (r) => qc.setQueryData(['parametres', 'settings', nodeId], r),
  });
};

export const delaisSchema = z.object({
  node_id: z.string(),
  default_days: z.number(),
  items: z.array(
    z.object({
      document_type: z.string(),
      document_type_label: z.string(),
      days: z.number().nullable(),
    }),
  ),
});
export type Delais = z.infer<typeof delaisSchema>;

export const useDelais = (nodeId: string | undefined) =>
  useQuery({
    queryKey: ['parametres', 'delais', nodeId],
    queryFn: async () =>
      delaisSchema.parse(
        await api.get<unknown>(
          `/v1/staff/documents/nodes/${nodeId}/type-delays/`,
          { quiet: true },
        ),
      ),
    enabled: !!nodeId,
  });

export const useEnregistrerDelais = (nodeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { document_type: string; days: number | null }[]) =>
      delaisSchema.parse(
        await api.put<unknown>(
          `/v1/staff/documents/nodes/${nodeId}/type-delays/`,
          { items },
        ),
      ),
    onSuccess: (d) => qc.setQueryData(['parametres', 'delais', nodeId], d),
  });
};

export const disponibiliteSchema = z.object({
  accepts_new_conversations: z.boolean(),
  absent_until: z.string().nullable(),
  reply_windows: z
    .array(z.object({ weekday: z.coerce.number(), start: z.string(), end: z.string() }))
    .default([]),
  note: z.string().default(''),
});
export type Disponibilite = z.infer<typeof disponibiliteSchema>;

export const useDisponibilite = (enabled: boolean) =>
  useQuery({
    queryKey: ['parametres', 'disponibilite'],
    queryFn: async () =>
      disponibiliteSchema.parse(
        await api.get<unknown>('/v1/messaging/availability/', { quiet: true }),
      ),
    enabled,
  });

export const useEnregistrerDisponibilite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Disponibilite>) =>
      disponibiliteSchema.parse(
        await api.put<unknown>('/v1/messaging/availability/', data),
      ),
    onSuccess: (d) => qc.setQueryData(['parametres', 'disponibilite'], d),
  });
};
