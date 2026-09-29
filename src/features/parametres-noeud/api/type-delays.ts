import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { Expect, Matches, RequestBody, ResponseBody } from '@/types/api-contract';

const typeDelaysSchema = z.object({
  node_id: z.string(),
  /** Délai appliqué aux types sans réglage propre (paroisse, sinon hérité, sinon défaut). */
  default_days: z.number(),
  items: z.array(z.object({ document_type: z.string(), document_type_label: z.string(), days: z.number().nullable() })),
});
export type TypeDelays = z.infer<typeof typeDelaysSchema>;

type _Keys = Expect<Matches<Exclude<keyof TypeDelays, keyof ResponseBody<'v1_staff_documents_nodes_type_delays_retrieve'>>, never>>;

export type TypeDelaysUpdate = RequestBody<'v1_staff_documents_nodes_type_delays_update'>;

const typeDelaysKey = (nodeId: string) => ['parametres', 'type-delays', nodeId] as const;
const typeDelaysUrl = (nodeId: string) => `/staff/documents/nodes/${encodeURIComponent(nodeId)}/type-delays/`;

export const getTypeDelays = async (nodeId: string) => typeDelaysSchema.parse(await api.get(typeDelaysUrl(nodeId)));

export const typeDelaysQueryOptions = (nodeId: string) => queryOptions({ queryKey: typeDelaysKey(nodeId), queryFn: () => getTypeDelays(nodeId) });

/** Délais indicatifs par type d'acte : `horaires.gerer` ou `structure.gerer` sur le nœud. */
export const useTypeDelays = (nodeId: string) => useQuery(typeDelaysQueryOptions(nodeId));

export const updateTypeDelays = async (nodeId: string, body: TypeDelaysUpdate) => typeDelaysSchema.parse(await api.put(typeDelaysUrl(nodeId), body));

export const useUpdateTypeDelays = (nodeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TypeDelaysUpdate) => updateTypeDelays(nodeId, body),
    onSuccess: (delays) => queryClient.setQueryData(typeDelaysKey(nodeId), delays),
  });
};
