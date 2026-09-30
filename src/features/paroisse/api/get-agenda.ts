import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { eventSchema } from './get-events';

// Agenda complet de la paroisse du fidèle : `GET /agenda/?node=<paroisse>` (opération `agenda_list`,
// nœud et sous-arbre), événements à venir triés par date, enveloppe `PaginatedEventOutputList`
// (limit/offset). Filtre facultatif `type`. Sans `node`, le serveur renverrait TOUTE la plateforme
// (event_list_public n'agrège pas les paroisses du fidèle) : le nœud est donc obligatoire.

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

export const getAgenda = async ({ nodeId, type, offset = 0 }: { nodeId: string; type?: EventType; offset?: number }) =>
  pageSchema.parse(await api.get('/agenda/', { params: { node: nodeId, type, limit: AGENDA_PAGE_SIZE, offset } }));

export const agendaQueryOptions = (nodeId: string, type?: EventType) =>
  infiniteQueryOptions({
    queryKey: ['paroisse', nodeId, 'agenda-complet', type ?? 'tous'],
    queryFn: ({ pageParam }) => getAgenda({ nodeId, type, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.next ? pages.reduce((n, p) => n + p.results.length, 0) : undefined),
  });

export const useAgenda = (nodeId: string | null, type?: EventType) =>
  useInfiniteQuery({ ...agendaQueryOptions(nodeId ?? '', type), enabled: Boolean(nodeId) });
