import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const noeudSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.object({ code: z.string(), label: z.string() }),
});

/** `GET /hierarchy/nodes/?q=&within=` : nœud d'affectation d'une invitation (sous-arbre du périmètre). */
export const useRechercheNoeuds = (
  filtres: { q?: string; within?: string },
  enabled = true,
) =>
  useQuery({
    queryKey: ['clergy-accounts', 'noeuds', filtres],
    queryFn: async () =>
      z.object({ count: z.number(), results: z.array(noeudSchema) }).parse(
        await api.get<unknown>('/hierarchy/nodes/', {
          params: {
            q: filtres.q?.trim() || undefined,
            within: filtres.within || undefined,
            limit: 50,
          },
        }),
      ),
    placeholderData: keepPreviousData,
    enabled,
  });
