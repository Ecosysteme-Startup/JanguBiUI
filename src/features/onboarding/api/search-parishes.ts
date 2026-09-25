import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const parishSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  city: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  is_active_on_platform: z.boolean(),
});
export type Parish = z.infer<typeof parishSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(parishSchema) });
export type ParishPage = z.infer<typeof pageSchema>;

/** Annuaire public : paroisses actives d'abord (le tri est fait ici, l'API trie par nom). */
export const searchParishes = async (q: string, signal?: AbortSignal): Promise<ParishPage> => {
  const page = pageSchema.parse(await api.get('/public/nodes/', { params: { q, type: 'paroisse', limit: 8 }, signal }));
  const results = [...page.results].sort((a, b) => Number(b.is_active_on_platform) - Number(a.is_active_on_platform));
  return { ...page, results };
};

export const searchParishesQueryOptions = (q: string) =>
  queryOptions({
    queryKey: ['public', 'nodes', 'paroisse', q],
    queryFn: ({ signal }) => searchParishes(q, signal),
    enabled: q.trim().length >= 2,
    placeholderData: keepPreviousData,
  });

export const useSearchParishes = (q: string) => useQuery(searchParishesQueryOptions(q));
