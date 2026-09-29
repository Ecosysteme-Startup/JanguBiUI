import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const groupSchema = z.object({
  book: z.object({ id: z.number(), name: z.string(), slug: z.string(), order: z.number(), testament: z.string() }),
  matches: z.array(
    z.object({
      verse: z.object({ id: z.number(), number: z.number(), chapter: z.object({ number: z.number() }), text: z.string() }),
    }),
  ),
});
export type SearchGroup = z.infer<typeof groupSchema>;

export const SEARCH_MIN_LENGTH = 3; // `SearchApi.InputSerializer.q` : min_length=3

export const searchBible = async (q: string, signal?: AbortSignal): Promise<SearchGroup[]> =>
  z.array(groupSchema).parse(await api.get('/bible/search/', { params: { q, limit: 30 }, signal }));

export const searchBibleQueryOptions = (q: string) =>
  queryOptions({
    queryKey: ['bible', 'search', q],
    queryFn: ({ signal }) => searchBible(q, signal),
    enabled: q.trim().length >= SEARCH_MIN_LENGTH,
    placeholderData: keepPreviousData,
  });

export const useSearchBible = (q: string) => useQuery(searchBibleQueryOptions(q.trim()));
