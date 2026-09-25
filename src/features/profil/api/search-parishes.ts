import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Doublon assumé de la feature `onboarding` (pas d'import entre features).
const parishSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  is_active_on_platform: z.boolean(),
});
export type ParishOption = z.infer<typeof parishSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(parishSchema) });

export const searchParishes = async (q: string, signal?: AbortSignal) =>
  pageSchema.parse(await api.get('/public/nodes/', { params: { q, type: 'paroisse', limit: 8 }, signal }));

export const useSearchParishes = (q: string) =>
  useQuery(
    queryOptions({
      queryKey: ['public', 'nodes', 'paroisse', q],
      queryFn: ({ signal }) => searchParishes(q, signal),
      enabled: q.trim().length >= 2,
      placeholderData: keepPreviousData,
    }),
  );
