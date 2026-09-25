import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const eventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().default(''),
  start_at: z.string(),
  end_at: z.string().nullable().optional(),
  location: z.string().default(''),
  is_cancelled: z.boolean().default(false),
});
export type PublicEvent = z.infer<typeof eventSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(eventSchema) });

/** Prochains événements publics d'un nœud (`GET /agenda/`, à partir de maintenant). */
export const getPublicEvents = async (nodeId: string, limit: number) =>
  pageSchema.parse(await api.get('/agenda/', { params: { node: nodeId, limit } }));

export const publicEventsQueryOptions = (nodeId: string, limit = 4) =>
  queryOptions({ queryKey: ['public', 'events', nodeId, limit], queryFn: () => getPublicEvents(nodeId, limit), staleTime: 5 * 60 * 1000 });

export const usePublicEvents = (nodeId: string, limit = 4) => useQuery(publicEventsQueryOptions(nodeId, limit));
