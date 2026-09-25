import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const rosaryTodaySchema = z.object({
  day: z.object({
    weekday: z.number(),
    group: z.object({ name: z.string(), slug: z.string(), mysteries: z.array(z.unknown()).catch([]) }).passthrough(),
  }),
});
export type RosaryToday = z.infer<typeof rosaryTodaySchema>;

/** Mystères du jour (lundi joyeux, jeudi lumineux…). */
export const getRosaryToday = async (): Promise<RosaryToday> => rosaryTodaySchema.parse(await api.get('/rosary/today/'));

export const rosaryTodayQueryOptions = () =>
  queryOptions({ queryKey: ['rosary', 'today'], queryFn: getRosaryToday, staleTime: 60 * 60 * 1000 });

export const useRosaryToday = () => useQuery(rosaryTodayQueryOptions());
