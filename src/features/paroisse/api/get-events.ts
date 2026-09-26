import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const eventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  event_type: z.string(),
  start_at: z.string(),
  end_at: z.string(),
  location: z.string(),
  node_id: z.string().nullable(),
  node_name: z.string().nullable(),
  max_participants: z.number().nullable(),
  registration_closes_at: z.string().nullable(),
  registrations_count: z.number(),
  /** Places réservées : la jauge compte les personnes, pas les inscriptions. */
  seats_taken: z.number(),
  seats_remaining: z.number().nullable(),
  is_full: z.boolean(),
  registrations_open: z.boolean(),
  is_registered: z.boolean(),
  my_seats: z.number().nullable(),
  my_note: z.string().nullable(),
  is_cancelled: z.boolean(),
});
export type ParishEvent = z.infer<typeof eventSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(eventSchema) });

/** Événements à venir de la paroisse (le backend part de maintenant). */
export const getEvents = async (nodeId: string, limit = 6) =>
  pageSchema.parse(await api.get('/agenda/', { params: { node: nodeId, limit } }));

export const eventsQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['paroisse', nodeId, 'agenda'], queryFn: () => getEvents(nodeId) });

export const useEvents = (nodeId: string | null) => useQuery({ ...eventsQueryOptions(nodeId ?? ''), enabled: Boolean(nodeId) });
