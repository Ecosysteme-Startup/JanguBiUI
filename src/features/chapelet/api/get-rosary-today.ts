import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type TodayRosary, todayRosarySchema } from './schemas';

export type { TodayRosary };

/**
 * GET /v1/rosary/today/ — public. 404 `{"error": "…"}` tant que les jours
 * du chapelet ne sont pas configurés côté backend.
 */
export const getRosaryToday = async (): Promise<TodayRosary> => {
  const res = await api.get<unknown>('/v1/rosary/today/');
  return todayRosarySchema.parse(res);
};

export const getRosaryTodayQueryOptions = () => {
  return queryOptions({
    queryKey: ['rosary', 'today'],
    queryFn: getRosaryToday,
  });
};

export const useRosaryToday = () => useQuery(getRosaryTodayQueryOptions());
