import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { structureKeys } from './node-schema';

const holderSchema = z.object({
  id: z.number(),
  person: z.object({ id: z.string(), full_name: z.string() }),
  office: z.string(),
  office_label: z.string(),
  node: z.object({ id: z.string() }),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
  status: z.enum(['proposee', 'active', 'terminee', 'annulee']).optional(),
});
export type Holder = z.infer<typeof holderSchema>;
const pageSchema = z.object({ count: z.number(), results: z.array(holderSchema) });

/** Titulaires d'offices du nœud lui-même (le filtre `node` de l'API porte sur le sous-arbre). */
export const getNodeHolders = async (nodeId: string): Promise<Holder[]> => {
  const [active, proposed] = await Promise.all(
    (['active', 'proposee'] as const).map(
      async (status) => pageSchema.parse(await api.get('/hierarchy/assignments/', { params: { node: nodeId, status, limit: 50 } })).results,
    ),
  );
  return [...active, ...proposed].filter((h) => h.node.id === nodeId);
};

/** Réservé à `offices.nommer` : l'API ne montre que les nominations des nœuds où on nomme. */
export const useNodeHolders = (nodeId: string, enabled: boolean) =>
  useQuery({ queryKey: structureKeys.holders(nodeId), queryFn: () => getNodeHolders(nodeId), enabled });
