import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const placeSchema = z.object({
  id: z.number(),
  name: z.string(),
  kind: z.string(),
  is_main: z.boolean(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  lat: z.union([z.string(), z.number()]).nullable().optional(),
  lng: z.union([z.string(), z.number()]).nullable().optional(),
  is_active: z.boolean().optional(),
});
export type Place = z.infer<typeof placeSchema>;

const occurrenceSchema = z.object({
  date: z.string(),
  kind: z.string(),
  start_time: z.string(),
  end_time: z.string().nullable(),
  place_id: z.number(),
  place_name: z.string(),
  language: z.string().default(''),
  note: z.string().default(''),
  is_exception: z.boolean().default(false),
});
export type Occurrence = z.infer<typeof occurrenceSchema>;

const weekSchema = z.object({
  start: z.string(),
  end: z.string(),
  places: z.array(placeSchema),
  occurrences: z.array(occurrenceSchema),
});
export type NodeWeek = z.infer<typeof weekSchema>;

/**
 * Sept jours d'horaires d'un nœud à partir de `start` (aujourd'hui par défaut), exceptions
 * comprises (`GET /public/nodes/{id}/week/?start=AAAA-MM-JJ`).
 */
export const getNodeWeek = async (nodeId: string, start?: string): Promise<NodeWeek> =>
  weekSchema.parse(await api.get(`/public/nodes/${encodeURIComponent(nodeId)}/week/`, { params: start ? { start } : undefined }));

export const nodeWeekQueryOptions = (nodeId: string, start?: string) =>
  queryOptions({
    queryKey: ['public', 'nodes', nodeId, 'week', start ?? 'today'],
    queryFn: () => getNodeWeek(nodeId, start),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(nodeId),
  });

export const useNodeWeek = (nodeId: string, start?: string) => useQuery({ ...nodeWeekQueryOptions(nodeId, start), placeholderData: keepPreviousData });
