import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const nodeSchema = z.object({ id: z.string(), name: z.string(), type: z.object({ label: z.string() }) });
export type SubNode = z.infer<typeof nodeSchema>;

/** Enfants directs du contexte : choix du sous-arbre filtré (lecture publique). */
export const useSubnodes = (nodeId: string) =>
  useQuery({
    queryKey: ['nominations', 'subnodes', nodeId],
    queryFn: async () => z.array(nodeSchema).parse(await api.get(`/hierarchy/nodes/${encodeURIComponent(nodeId)}/children/`)),
    staleTime: 10 * 60 * 1000,
  });
