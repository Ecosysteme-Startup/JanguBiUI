import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type DonorSummary, donorSummarySchema } from '../types/schemas';

/** Total de mes dons confirmés sur l'année, par fonds. */
export const getMySummary = async (year: number): Promise<DonorSummary> =>
  donorSummarySchema.parse(await api.get('/me/dons/resume/', { params: { year } }));

export const mySummaryQueryOptions = (year: number) =>
  queryOptions({ queryKey: ['dons', 'mine', 'resume', year], queryFn: () => getMySummary(year) });

export const useMySummary = (year: number) => useQuery(mySummaryQueryOptions(year));
