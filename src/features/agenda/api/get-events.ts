import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { paginatedSchema } from '@/lib/pagination';

// Contrat réel : apps/agenda EventOutputSerializer (GET /v1/agenda/,
// /v1/agenda/<id>/, POST /v1/agenda/<id>/register/). Le fil est agrégé côté
// back (paroisses du fidèle et nœuds parents) et ne contient que les
// événements à venir, triés par date.
export const eventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().default(''),
  event_type: z.string(),
  start_at: z.string(),
  end_at: z.string(),
  location: z.string().default(''),
  node_id: z.string().nullable().optional(),
  node_name: z.string().nullable().optional(),
  place_id: z.number().nullable().optional(),
  max_participants: z.number().nullable().optional(),
  registration_closes_at: z.string().nullable().optional(),
  registrations_count: z.number().default(0),
  seats_taken: z.number().default(0),
  seats_remaining: z.number().nullable().optional(),
  is_full: z.boolean().default(false),
  registrations_open: z.boolean().default(true),
  is_registered: z.boolean().default(false),
  my_seats: z.number().nullable().optional(),
  my_note: z.string().nullable().optional(),
  is_cancelled: z.boolean().default(false),
});

export type Event = z.infer<typeof eventSchema>;

const eventsResponseSchema = paginatedSchema(eventSchema);
export type EventsResponse = z.infer<typeof eventsResponseSchema>;

export const EVENTS_PAGE_SIZE = 20;

export type EventsParams = {
  /** Filtre `type` (mass, conference, retreat, ordination, other). */
  type?: string;
  /** Un nœud précis (paroisse), sinon le fil agrégé. */
  node?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
};

export const getEvents = (params: EventsParams = {}): Promise<EventsResponse> =>
  api
    .get<unknown>('/v1/agenda/', {
      params: { limit: EVENTS_PAGE_SIZE, ...params },
    })
    .then((data) => eventsResponseSchema.parse(data));

export const getEventsQueryOptions = (params?: EventsParams, enabled = true) =>
  queryOptions({
    queryKey: ['events', params ?? {}],
    queryFn: () => getEvents(params),
    enabled,
  });

export const useEvents = (params?: EventsParams, enabled = true) =>
  useQuery(getEventsQueryOptions(params, enabled));

/** Fil paginé (« Voir plus ») : limit/offset du backend. */
export const getInfiniteEventsQueryOptions = (
  params: Omit<EventsParams, 'offset'> = {},
) =>
  infiniteQueryOptions({
    queryKey: ['events', 'infinite', params],
    queryFn: ({ pageParam }) => getEvents({ ...params, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.next ? last.offset + last.results.length : undefined,
  });

export const useInfiniteEvents = (params: Omit<EventsParams, 'offset'> = {}) =>
  useInfiniteQuery(getInfiniteEventsQueryOptions(params));
