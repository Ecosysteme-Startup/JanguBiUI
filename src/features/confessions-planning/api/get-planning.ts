import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { type PlanningSlot, planningSlotSchema } from './schemas';

/** Planning sur quatre semaines à partir de `dateFrom` (créneaux du nœud et les miens). */
export const getPlanning = async (
  nodeId: string,
  dateFrom: string,
): Promise<PlanningSlot[]> =>
  z.array(planningSlotSchema).parse(
    await api.get('/staff/confessions/planning/', {
      params: { node: nodeId, date_from: dateFrom },
    }),
  );

export const planningQueryOptions = (nodeId: string, dateFrom: string) =>
  queryOptions({
    queryKey: ['confessions-planning', 'planning', nodeId, dateFrom],
    queryFn: () => getPlanning(nodeId, dateFrom),
    placeholderData: keepPreviousData,
  });

export const usePlanning = (nodeId: string, dateFrom: string) =>
  useQuery(planningQueryOptions(nodeId, dateFrom));
