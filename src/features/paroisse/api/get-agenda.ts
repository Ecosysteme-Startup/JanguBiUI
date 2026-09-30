import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { eventSchema } from './get-events';

// Agenda complet du fidèle : `GET /agenda/` sans `node` (opération `agenda_list`), fil agrégé côté
// serveur (paroisses suivies et leurs nœuds parents), événements à venir triés par date,
// enveloppe `PaginatedEventOutputList` (limit/offset). Filtre facultatif `type`.

export const EVENT_TYPES = ['mass', 'conference', 'retreat', 'ordination', 'other'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const AGENDA_PAGE_SIZE = 20;

const pageSchema = z.object({
  count: z.number(),
  next: z.string().nullish(),
  previous: z.string().nullish(),
  results: z.array(eventSchema),
});
export type AgendaPage = z.infer<typeof pageSchema>;

export const getAgenda = async ({ type, offset = 0 }: { type?: EventType; offset?: number } = {}) =>
  pageSchema.parse(await api.get('/agenda/', { params: { type, limit: AGENDA_PAGE_SIZE, offset } }));

export const agendaQueryOptions = (type?: EventType) =>
  infiniteQueryOptions({
    queryKey: ['paroisse', 'agenda-complet', type ?? 'tous'],
    queryFn: ({ pageParam }) => getAgenda({ type, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.next ? pages.reduce((n, p) => n + p.results.length, 0) : undefined),
  });

export const useAgenda = (type?: EventType) => useInfiniteQuery(agendaQueryOptions(type));
