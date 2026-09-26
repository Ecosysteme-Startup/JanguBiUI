import { useQuery } from '@tanstack/react-query';

import { type ParishSearchPage, type ParishSearchResult, parishSearchQueryOptions } from '@/hooks/use-parish-search';

export type Parish = ParishSearchResult;
export type ParishPage = ParishSearchPage;

/** Paroisses actives d'abord (tri à la lecture : le cache partagé garde l'ordre de l'API). */
const activeFirst = (page: ParishSearchPage): ParishSearchPage => ({
  ...page,
  results: [...page.results].sort((a, b) => Number(b.is_active_on_platform) - Number(a.is_active_on_platform)),
});

export const useSearchParishes = (q: string) => useQuery({ ...parishSearchQueryOptions(q), select: activeFirst });
