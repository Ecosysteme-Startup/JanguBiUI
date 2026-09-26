import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

/**
 * Recherche de paroisses dans l'annuaire public, partagée par la demande d'acte, l'inscription
 * et le profil. Une seule clé ET un seul schéma : trois schémas différents sur la même clé
 * faisaient qu'une recherche mise en cache par la demande d'acte (sans
 * `is_active_on_platform`) était relue telle quelle par le profil.
 */
const parishSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  city: z.string().nullish(),
  address: z.string().nullish(),
  is_active_on_platform: z.boolean(),
});
export type ParishSearchResult = z.infer<typeof parishSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(parishSchema) });
export type ParishSearchPage = z.infer<typeof pageSchema>;

/** TOUTES les paroisses, actives ou non sur Jàngu Bi (l'API trie par nom). */
export const searchParishes = async (q: string, signal?: AbortSignal): Promise<ParishSearchPage> =>
  pageSchema.parse(await api.get('/public/nodes/', { params: { q, type: 'paroisse', limit: 8 }, signal }));

export const parishSearchQueryOptions = (q: string) =>
  queryOptions({
    queryKey: ['public', 'nodes', 'paroisse', q],
    queryFn: ({ signal }) => searchParishes(q, signal),
    enabled: q.trim().length >= 2,
    placeholderData: keepPreviousData,
  });
