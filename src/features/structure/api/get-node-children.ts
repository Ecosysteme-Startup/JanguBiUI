import { useQueries } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { nodeSchema, type StructureNode, structureKeys } from './node-schema';

export const getNodeChildren = async (id: string): Promise<StructureNode[]> =>
  z.array(nodeSchema).parse(await api.get(`/hierarchy/nodes/${encodeURIComponent(id)}/children/`));

/** Enfants directs des nœuds ouverts (chargement paresseux de l'arbre). */
export const useNodesChildren = (ids: string[]) =>
  useQueries({
    queries: ids.map((id) => ({ queryKey: structureKeys.children(id), queryFn: () => getNodeChildren(id), staleTime: 60 * 1000 })),
    combine: (results) => new Map(ids.map((id, i) => [id, results[i]?.data] as const)),
  });
