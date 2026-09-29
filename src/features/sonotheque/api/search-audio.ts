import { useInfiniteQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { rechercheSchema, type Recherche } from '../types/schemas';

import { AUDIO, sonoKeys } from './keys';

/** En dessous de 2 caractères, l'API répond 400 recherche_trop_courte. */
export const RECHERCHE_MIN = 2;

// GET /audio/recherche/?q=&limit=&cursor= — filtre de visibilité d'abord, puis
// pertinence, puis popularité à l'intérieur des résultats.
export const searchAudio = async ({
  q,
  cursor,
  limit = 20,
}: {
  q: string;
  cursor?: string | null;
  limit?: number;
}): Promise<Recherche> =>
  rechercheSchema.parse(
    await api.get<unknown>(`${AUDIO}/recherche/`, {
      params: { q, limit, cursor: cursor ?? undefined },
    }),
  );

export const useSearchAudio = (q: string) => {
  const query = q.trim();
  return useInfiniteQuery({
    queryKey: sonoKeys.recherche(query),
    queryFn: ({ pageParam }) => searchAudio({ q: query, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_cursor,
    enabled: query.length >= RECHERCHE_MIN,
  });
};
