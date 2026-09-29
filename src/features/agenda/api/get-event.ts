import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { eventSchema, type Event } from './get-events';

// Le détail renvoie le même EventOutputSerializer que la liste → on réutilise
// le schéma de get-events plutôt que d'en dupliquer un.
export const getEvent = (eventId: number): Promise<Event> =>
  api
    .get<unknown>(`/v1/agenda/${eventId}/`)
    .then((data) => eventSchema.parse(data));

export const getEventQueryOptions = (eventId: number, enabled = true) =>
  queryOptions({
    queryKey: ['event', eventId],
    queryFn: () => getEvent(eventId),
    enabled,
  });

export const useEvent = (eventId: number, enabled = true) =>
  useQuery(getEventQueryOptions(eventId, enabled));
