import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const childSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string().nullable(),
  type: z.object({ code: z.string(), label: z.string() }),
});
export type NodeChild = z.infer<typeof childSchema>;

export const getNodeChildren = async (nodeId: string) =>
  z.array(childSchema).parse(await api.get(`/hierarchy/nodes/${encodeURIComponent(nodeId)}/children/`));

export const nodeChildrenQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['parametres', 'node-children', nodeId], queryFn: () => getNodeChildren(nodeId) });

/** Nœuds rattachés (CEB…) : lecture publique. */
export const useNodeChildren = (nodeId: string) => useQuery(nodeChildrenQueryOptions(nodeId));
