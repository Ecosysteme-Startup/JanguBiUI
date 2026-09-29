import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type ParishSummary, parishSummarySchema } from '../types/schemas';

/** Synthèse du mois (`month` = AAAA-MM) : affecté, en ligne, espèces, par fonds, par moyen, par jour. */
export const getParishSummary = async (nodeId: string, month?: string): Promise<ParishSummary> =>
  parishSummarySchema.parse(await api.get('/staff/dons/synthese/', { params: { node: nodeId, month } }));

export const parishSummaryQueryOptions = (nodeId: string, month?: string) =>
  queryOptions({ queryKey: ['dons', nodeId, 'synthese', month ?? ''], queryFn: () => getParishSummary(nodeId, month), placeholderData: keepPreviousData });

export const useParishSummary = (nodeId: string, month?: string) => useQuery(parishSummaryQueryOptions(nodeId, month));
