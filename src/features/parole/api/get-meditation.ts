import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Article publié (`ArticleOutputSerializer`) : on ne garde que ce que la carte affiche.
const meditationSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string().nullable().optional(),
  author_name: z.string(),
  scope: z.object({ node_name: z.string().nullable().optional() }).nullable().optional(),
});
export type Meditation = z.infer<typeof meditationSchema>;

export const getMeditation = async (id: string, signal?: AbortSignal): Promise<Meditation> =>
  meditationSchema.parse(await api.get(`/news/${id}/`, { signal }));

export const meditationQueryOptions = (id: string | null) =>
  queryOptions({
    queryKey: ['news', 'article', id],
    queryFn: ({ signal }) => getMeditation(id as string, signal),
    enabled: Boolean(id),
    staleTime: 30 * 60 * 1000,
  });

export const useMeditation = (id: string | null) => useQuery(meditationQueryOptions(id));
