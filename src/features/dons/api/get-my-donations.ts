import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type MyDonationPage, myDonationPageSchema } from '../types/schemas';

export const MY_DONATIONS_PAGE_SIZE = 10;

export type MyDonationsFilters = { year: number; fund?: string; page: number };

/** Mes dons (visibles par moi seul), filtrés par année et par fonds. */
export const getMyDonations = async (f: MyDonationsFilters): Promise<MyDonationPage> =>
  myDonationPageSchema.parse(
    await api.get('/me/dons/', {
      params: { year: f.year, fund: f.fund, limit: MY_DONATIONS_PAGE_SIZE, offset: (f.page - 1) * MY_DONATIONS_PAGE_SIZE },
    }),
  );

export const myDonationsQueryOptions = (filters: MyDonationsFilters) =>
  queryOptions({ queryKey: ['dons', 'mine', filters], queryFn: () => getMyDonations(filters), placeholderData: keepPreviousData });

export const useMyDonations = (filters: MyDonationsFilters) => useQuery(myDonationsQueryOptions(filters));
