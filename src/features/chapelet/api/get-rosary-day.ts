import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import type { RosaryToday } from '@/hooks/use-rosary-today';
import { api } from '@/lib/api-client';

// Même forme que `/rosary/today/` (`DayRosaryApi`), pour prier les mystères d'un autre jour.
const prayerSchema = z.object({ id: z.union([z.string(), z.number()]), type: z.string(), type_display: z.string(), text: z.string() });

const mysterySchema = z.object({
  id: z.union([z.string(), z.number()]),
  order: z.number(),
  title: z.string(),
  meditation: z.string().nullable(),
  meditation_source: z.string().nullable().optional(),
  fruit: z.string(),
  prayers: z.array(z.object({ order: z.number(), prayer: prayerSchema })),
});

const rosaryDaySchema = z.object({
  day: z.object({
    weekday: z.number(),
    weekday_display: z.string(),
    group: z.object({ name: z.string(), slug: z.string(), mysteries: z.array(mysterySchema) }),
  }),
  standalone_prayers: z.array(prayerSchema),
});

/** Mystères d'un jour de la semaine (0 = lundi) et prières d'ouverture/de clôture. */
export const getRosaryDay = async (weekday: number, signal?: AbortSignal): Promise<RosaryToday> =>
  rosaryDaySchema.parse(await api.get(`/rosary/day/${weekday}/`, { signal }));

export const rosaryDayQueryOptions = (weekday: number) =>
  queryOptions({ queryKey: ['rosary', 'day', weekday], queryFn: ({ signal }) => getRosaryDay(weekday, signal), staleTime: 60 * 60 * 1000 });

export const useRosaryDay = (weekday: number | null) => useQuery({ ...rosaryDayQueryOptions(weekday ?? 0), enabled: weekday !== null });
