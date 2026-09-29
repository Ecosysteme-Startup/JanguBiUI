import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const nodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  type: z.object({ code: z.string() }).passthrough(),
});
export type NodeSummary = z.infer<typeof nodeSchema>;

export const getNode = async (nodeId: string): Promise<NodeSummary> =>
  nodeSchema.parse(await api.get(`/hierarchy/nodes/${encodeURIComponent(nodeId)}/`));

export const nodeQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['hierarchy', 'nodes', nodeId], queryFn: () => getNode(nodeId), staleTime: 30 * 60 * 1000 });

/** Nœud de l'arbre (lecture publique). */
export const useNode = (nodeId: string | null) => useQuery({ ...nodeQueryOptions(nodeId ?? ''), enabled: Boolean(nodeId) });
