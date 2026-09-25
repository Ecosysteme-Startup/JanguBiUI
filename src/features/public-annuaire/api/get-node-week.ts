import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const placeSchema = z.object({
  id: z.number(),
  name: z.string(),
  kind: z.string(),
  is_main: z.boolean(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
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

/** Semaine des horaires d'un nœud, exceptions comprises (`GET /public/nodes/{id}/week/`). */
export const getNodeWeek = async (nodeId: string): Promise<NodeWeek> =>
  weekSchema.parse(await api.get(`/public/nodes/${encodeURIComponent(nodeId)}/week/`));

export const nodeWeekQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['public', 'nodes', nodeId, 'week'], queryFn: () => getNodeWeek(nodeId), staleTime: 5 * 60 * 1000 });

export const useNodeWeek = (nodeId: string) => useQuery(nodeWeekQueryOptions(nodeId));
