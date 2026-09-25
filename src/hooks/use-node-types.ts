import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const nodeTypeSchema = z.object({
  code: z.string(),
  label: z.string(),
  is_territorial: z.boolean().default(false),
  holds_registers: z.boolean().default(false),
  order: z.number().default(0),
  allowed_parent_types: z.array(z.string()),
});
export type NodeType = z.infer<typeof nodeTypeSchema>;

export const getNodeTypes = async (): Promise<NodeType[]> => z.array(nodeTypeSchema).parse(await api.get('/hierarchy/node-types/'));

export const nodeTypesQueryOptions = () =>
  queryOptions({ queryKey: ['hierarchy', 'node-types'], queryFn: getNodeTypes, staleTime: 60 * 60 * 1000 });

/** Types de nœuds et parents autorisés (lecture publique). */
export const useNodeTypes = () => useQuery(nodeTypesQueryOptions());

/** Libellé court d'un type (« Paroisse ») ; le code en attendant le catalogue. */
export const nodeTypeLabel = (types: NodeType[] | undefined, code: string) => types?.find((t) => t.code === code)?.label ?? code;
