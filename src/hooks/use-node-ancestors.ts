import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const nodeSchema = z.object({ id: z.string(), name: z.string(), code: z.string() });

export const getNodeAncestors = async (nodeId: string) =>
  z.array(nodeSchema).parse(await api.get(`/hierarchy/nodes/${encodeURIComponent(nodeId)}/ancestors/`));

export const nodeAncestorsQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['hierarchy', 'nodes', nodeId, 'ancestors'], queryFn: () => getNodeAncestors(nodeId), staleTime: 30 * 60 * 1000 });

/** Parent immédiat d'un nœud (« Archidiocèse de Dakar » sous une paroisse). Lecture publique. */
export const useNodeParentName = (nodeId: string | null): string | undefined => {
  const { data } = useQuery({ ...nodeAncestorsQueryOptions(nodeId ?? ''), enabled: Boolean(nodeId) });
  return data?.at(-1)?.name;
};
