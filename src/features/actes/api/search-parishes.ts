import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const parishSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  city: z.string().nullish(),
  address: z.string().nullish(),
});
export type SacramentParish = z.infer<typeof parishSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(parishSchema) });

/**
 * Annuaire public : TOUTES les paroisses, actives ou non sur Jàngu Bi — le sacrement a pu
 * être célébré dans une paroisse qui n'a pas encore rejoint la plateforme.
 */
export const searchSacramentParishes = async (q: string, signal?: AbortSignal) =>
  pageSchema.parse(await api.get('/public/nodes/', { params: { q, type: 'paroisse', limit: 8 }, signal }));

export const sacramentParishesQueryOptions = (q: string) =>
  queryOptions({
    queryKey: ['public', 'nodes', 'paroisse', q],
    queryFn: ({ signal }) => searchSacramentParishes(q, signal),
    enabled: q.trim().length >= 2,
    placeholderData: keepPreviousData,
  });

export const useSacramentParishes = (q: string) => useQuery(sacramentParishesQueryOptions(q));
