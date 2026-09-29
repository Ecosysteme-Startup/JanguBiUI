import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const placeSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_main: z.boolean().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
});
export type WeekPlace = z.infer<typeof placeSchema>;

const occurrenceSchema = z.object({
  date: z.string(),
  kind: z.string(),
  start_time: z.string(),
  end_time: z.string().nullable(),
  place_id: z.number(),
  place_name: z.string(),
  language: z.string(),
  note: z.string(),
  is_exception: z.boolean(),
});
export type Occurrence = z.infer<typeof occurrenceSchema>;

const weekSchema = z.object({
  start: z.string(),
  end: z.string(),
  places: z.array(placeSchema),
  occurrences: z.array(occurrenceSchema),
});
export type ParishWeek = z.infer<typeof weekSchema>;

/** Semaine des horaires (7 jours dès aujourd'hui), exceptions comprises (EF-PAROI-06). */
export const getParishWeek = async (nodeId: string): Promise<ParishWeek> =>
  weekSchema.parse(await api.get(`/public/nodes/${encodeURIComponent(nodeId)}/week/`));

export const parishWeekQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['paroisse', nodeId, 'semaine'], queryFn: () => getParishWeek(nodeId), staleTime: 10 * 60 * 1000 });

export const useParishWeek = (nodeId: string | null) =>
  useQuery({ ...parishWeekQueryOptions(nodeId ?? ''), enabled: Boolean(nodeId) });
