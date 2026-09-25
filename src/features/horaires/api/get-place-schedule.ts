import { queryOptions, useQueries } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { Expect, Matches, ResponseBody } from '@/types/api-contract';

/** 0 = lundi … 6 = dimanche (contrat `WeekdayEnum`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const scheduleSchema = z.object({
  id: z.number(),
  kind: z.enum(['messe', 'confession', 'adoration']),
  weekday: z
    .number()
    .int()
    .min(0)
    .max(6)
    .transform((n) => n as Weekday),
  start_time: z.string(),
  end_time: z.string().nullable().optional().default(null),
  language: z.string().optional().default(''),
  note: z.string().optional().default(''),
  valid_from: z.string().nullable().optional().default(null),
  valid_to: z.string().nullable().optional().default(null),
});
export type Schedule = z.infer<typeof scheduleSchema>;

type _ScheduleKeys = Expect<
  Matches<Exclude<keyof Schedule, keyof ResponseBody<'v1_hierarchy_places_schedule_list'>[number]>, never>
>;

export const placeScheduleKey = (placeId: number) => ['hierarchy', 'places', placeId, 'schedule'] as const;

export const getPlaceSchedule = async (placeId: number): Promise<Schedule[]> =>
  z.array(scheduleSchema).parse(await api.get(`/hierarchy/places/${placeId}/schedule/`));

export const placeScheduleQueryOptions = (placeId: number) =>
  queryOptions({ queryKey: placeScheduleKey(placeId), queryFn: () => getPlaceSchedule(placeId) });

/** Semaines types de plusieurs lieux, chargées en parallèle. */
export const usePlaceSchedules = (placeIds: number[]) =>
  useQueries({
    queries: placeIds.map((id) => placeScheduleQueryOptions(id)),
    combine: (results) => ({
      byPlace: Object.fromEntries(placeIds.map((id, i) => [id, results[i]?.data ?? []])) as Record<number, Schedule[]>,
      isPending: results.some((r) => r.isPending),
      error: results.find((r) => r.error)?.error ?? null,
    }),
  });
