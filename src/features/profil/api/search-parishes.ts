import { useQuery } from '@tanstack/react-query';

import { type ParishSearchResult, parishSearchQueryOptions } from '@/hooks/use-parish-search';

export type ParishOption = ParishSearchResult;

export const useSearchParishes = (q: string) => useQuery(parishSearchQueryOptions(q));
