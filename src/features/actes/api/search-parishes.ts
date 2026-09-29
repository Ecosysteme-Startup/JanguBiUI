import { useQuery } from '@tanstack/react-query';

import { type ParishSearchResult, parishSearchQueryOptions } from '@/hooks/use-parish-search';

/**
 * Annuaire public : TOUTES les paroisses, actives ou non sur Jàngu Bi — le sacrement a pu
 * être célébré dans une paroisse qui n'a pas encore rejoint la plateforme.
 */
export type SacramentParish = ParishSearchResult;

export const useSacramentParishes = (q: string) => useQuery(parishSearchQueryOptions(q));
