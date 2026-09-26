import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Doublon assumé de la feature `paroisse` : l'accueil ne montre que le prochain événement.
const eventSchema = z.object({
  id: z.number(),
  title: z.string(),
  start_at: z.string(),
  location: z.string(),
  seats_remaining: z.number().nullable(),
  is_cancelled: z.boolean(),
});
export type HomeEvent = z.infer<typeof eventSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(eventSchema) });

/** Événements à venir de la paroisse (le backend part de maintenant). */
export const getEvents = async (nodeId: string) => pageSchema.parse(await api.get('/agenda/', { params: { node: nodeId, limit: 3 } }));

export const eventsQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['accueil', nodeId, 'agenda'], queryFn: () => getEvents(nodeId) });

export const useEvents = (nodeId: string | null) => useQuery({ ...eventsQueryOptions(nodeId ?? ''), enabled: Boolean(nodeId) });
