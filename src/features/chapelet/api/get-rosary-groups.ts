import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { type RosaryGroup, rosaryGroupSchema } from './schemas';

export type { RosaryGroup };

/** GET /v1/rosary/groups/ — liste nue des quatre groupes de mystères. */
export const getRosaryGroups = async (): Promise<RosaryGroup[]> => {
  const res = await api.get<unknown>('/v1/rosary/groups/');
  return z.array(rosaryGroupSchema).parse(res);
};

export const getRosaryGroupsQueryOptions = () => {
  return queryOptions({
    queryKey: ['rosary', 'groups'],
    queryFn: getRosaryGroups,
  });
};

export const useRosaryGroups = () => useQuery(getRosaryGroupsQueryOptions());
