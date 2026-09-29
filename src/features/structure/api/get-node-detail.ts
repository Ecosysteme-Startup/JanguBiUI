import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { nodeSchema, type StructureNode, structureKeys } from './node-schema';

export const getNodeDetail = async (id: string): Promise<StructureNode> =>
  nodeSchema.parse(await api.get(`/hierarchy/nodes/${encodeURIComponent(id)}/`));

/** Détail d'un nœud (lecture publique). */
export const useNodeDetail = (id: string | null | undefined) =>
  useQuery({ queryKey: structureKeys.node(id ?? ''), queryFn: () => getNodeDetail(id!), enabled: Boolean(id) });
