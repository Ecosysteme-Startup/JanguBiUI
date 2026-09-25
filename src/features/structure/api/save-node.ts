import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { nodeSchema, type StructureNode, structureKeys } from './node-schema';

export type NodeCreateBody = RequestBody<'v1_hierarchy_nodes_create'>;
export type NodeUpdateBody = RequestBody<'v1_hierarchy_nodes_partial_update'>;

export const createNode = async (body: NodeCreateBody): Promise<StructureNode> =>
  nodeSchema.parse(await api.post('/hierarchy/nodes/', body));

export const updateNode = async ({ id, body }: { id: string; body: NodeUpdateBody }): Promise<StructureNode> =>
  nodeSchema.parse(await api.patch(`/hierarchy/nodes/${encodeURIComponent(id)}/`, body));

const useInvalidateStructure = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: structureKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['hierarchy', 'nodes'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboards', 'deployment'] }),
    ]);
};

/** Créer un nœud (structure.gerer sur le parent). */
export const useCreateNode = () => {
  const invalidate = useInvalidateStructure();
  return useMutation({ mutationFn: createNode, onSuccess: invalidate });
};

/** Modifier un nœud ou son statut (structure.gerer). */
export const useUpdateNode = () => {
  const invalidate = useInvalidateStructure();
  return useMutation({ mutationFn: updateNode, onSuccess: invalidate });
};
