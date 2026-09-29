import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type PublicFundDetail, publicFundDetailSchema } from '../types/schemas';

/** Fiche d'un fonds (campagne) : avancement, usage des fonds, nouvelles (public). */
export const getPublicFund = async (fundId: string): Promise<PublicFundDetail> =>
  publicFundDetailSchema.parse(await api.get(`/public/dons/fonds/${encodeURIComponent(fundId)}/`));

export const publicFundQueryOptions = (fundId: string) =>
  queryOptions({ queryKey: ['dons', 'fonds', fundId], queryFn: () => getPublicFund(fundId) });

export const usePublicFund = (fundId: string) => useQuery(publicFundQueryOptions(fundId));
