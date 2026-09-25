import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const pageSchema = z.object({ count: z.number(), results: z.array(z.object({ id: z.string(), name: z.string() })) });

/** Diocèses de l'arbre : choix du nœud filtré et libellé des événements (lecture publique). */
export const useAuditDioceses = () =>
  useQuery({
    queryKey: ['audit', 'dioceses'],
    queryFn: async () => pageSchema.parse(await api.get('/hierarchy/nodes/', { params: { type: 'diocese', limit: 50 } })).results,
    staleTime: 30 * 60 * 1000,
  });
