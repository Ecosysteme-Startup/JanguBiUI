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

/** Seuls les champs du secrétariat sont modifiés ici (sous-ensemble de `PatchedNodeUpdateInput`). */
export type NodeSettingsUpdate = Pick<RequestBody<'v1_hierarchy_nodes_partial_update'>, 'address' | 'city'>;

/** PATCH du nœud : le serveur exige `structure.gerer` sur ce nœud (et la MFA). */
export const updateNodeSettings = async (nodeId: string, body: NodeSettingsUpdate) =>
  nodeSettingsSchema.parse(await api.patch(`/hierarchy/nodes/${encodeURIComponent(nodeId)}/`, body));

export const useUpdateNodeSettings = (nodeId: string, { onSuccess }: { onSuccess?: (node: NodeSettings) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: NodeSettingsUpdate) => updateNodeSettings(nodeId, body),
    onSuccess: async (node) => {
      queryClient.setQueryData(nodeSettingsKey(nodeId), node);
      await queryClient.invalidateQueries({ queryKey: ['hierarchy', 'nodes', nodeId] });
      onSuccess?.(node);
    },
  });
};
