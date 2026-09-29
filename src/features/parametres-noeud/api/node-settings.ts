import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { Expect, Matches, RequestBody, ResponseBody } from '@/types/api-contract';

export const NODE_STATUS_LABELS: Record<string, string> = { en_fondation: 'En fondation', erige: 'Érigé', supprime: 'Supprimé' };

const nodeSettingsSchema = z.object({
  id: z.string(),
  type: z.object({ code: z.string(), label: z.string() }),
  name: z.string(),
  code: z.string(),
  status: z.string(),
  address: z.string().nullable().transform((v) => v ?? ''),
  city: z.string().nullable().transform((v) => v ?? ''),
  erected_at: z.string().nullable(),
  is_active_on_platform: z.boolean(),
  has_children: z.boolean(),
});
export type NodeSettings = z.infer<typeof nodeSettingsSchema>;

type _NodeKeys = Expect<Matches<Exclude<keyof NodeSettings, keyof ResponseBody<'v1_hierarchy_nodes_retrieve'>>, never>>;

const nodeSettingsKey = (nodeId: string) => ['parametres', 'node', nodeId] as const;

export const getNodeSettings = async (nodeId: string) => nodeSettingsSchema.parse(await api.get(`/hierarchy/nodes/${encodeURIComponent(nodeId)}/`));

export const nodeSettingsQueryOptions = (nodeId: string) => queryOptions({ queryKey: nodeSettingsKey(nodeId), queryFn: () => getNodeSettings(nodeId) });

export const useNodeSettings = (nodeId: string) => useQuery(nodeSettingsQueryOptions(nodeId));

/* --- Vie paroissiale : secrétariat, accueil, demandes d'actes (GET/PATCH …/settings/) --- */

const parishLifeSchema = z.object({
  id: z.string(),
  address: z.string(),
  city: z.string(),
  phone: z.string(),
  email: z.string(),
  office_hours: z.array(z.object({ days: z.string(), hours: z.string() })),
  secretariat_public: z.boolean(),
  acts_delay_days: z.number().nullable(),
  acts_welcome_message: z.string(),
  updated_at: z.string(),
});
export type ParishLife = z.infer<typeof parishLifeSchema>;

type _LifeKeys = Expect<Matches<Exclude<keyof ParishLife, keyof ResponseBody<'v1_hierarchy_nodes_settings_retrieve'>>, never>>;

export type ParishLifeUpdate = RequestBody<'v1_hierarchy_nodes_settings_partial_update'>;

const parishLifeKey = (nodeId: string) => ['parametres', 'settings', nodeId] as const;

const settingsUrl = (nodeId: string) => `/hierarchy/nodes/${encodeURIComponent(nodeId)}/settings/`;

export const getParishLife = async (nodeId: string) => parishLifeSchema.parse(await api.get(settingsUrl(nodeId)));

export const parishLifeQueryOptions = (nodeId: string) => queryOptions({ queryKey: parishLifeKey(nodeId), queryFn: () => getParishLife(nodeId) });

/** Lecture réservée à `horaires.gerer` ou `structure.gerer` sur le nœud. */
export const useParishLife = (nodeId: string) => useQuery(parishLifeQueryOptions(nodeId));

/** PATCH des paramètres du secrétariat : `horaires.gerer` suffit (nom, code, statut restent à la chancellerie). */
export const updateParishLife = async (nodeId: string, body: ParishLifeUpdate) => parishLifeSchema.parse(await api.patch(settingsUrl(nodeId), body));

export const useUpdateParishLife = (nodeId: string, { onSuccess }: { onSuccess?: (settings: ParishLife) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ParishLifeUpdate) => updateParishLife(nodeId, body),
    onSuccess: async (settings) => {
      queryClient.setQueryData(parishLifeKey(nodeId), settings);
      await queryClient.invalidateQueries({ queryKey: nodeSettingsKey(nodeId) });
      await queryClient.invalidateQueries({ queryKey: ['hierarchy', 'nodes', nodeId] });
      await queryClient.invalidateQueries({ queryKey: ['public'] });
      onSuccess?.(settings);
    },
  });
};
