import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { Expect, Matches, ResponseBody } from '@/types/api-contract';

export const PERSON_SEARCH_MIN = 2;
const PERSON_SEARCH_LIMIT = 8;

const personOptionSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  email_masked: z.string(),
  etat_de_vie: z.string(),
  degre_ordre: z.string(),
  statut_verification: z.enum(['declare', 'verifie', 'rejete', 'complement']),
  incardination_node: z.object({ id: z.string(), name: z.string(), code: z.string(), type: z.string() }).nullable(),
});
export type PersonOption = z.infer<typeof personOptionSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(personOptionSchema) });
type PersonPage = z.infer<typeof pageSchema>;

type _PersonPageMatchesContract = Expect<Matches<PersonPage, Pick<ResponseBody<'hierarchy_persons_list'>, 'count' | 'results'>>>;

/** Recherche de la personne à nommer (offices.nommer) : nom, prénom ou e-mail ; e-mail masqué en retour. */
export const searchPersons = async (q: string) =>
  pageSchema.parse(await api.get('/hierarchy/persons/', { params: { q, limit: PERSON_SEARCH_LIMIT } }));

export const personSearchQueryOptions = (q: string) =>
  queryOptions({
    queryKey: ['hierarchy', 'persons', q],
    queryFn: () => searchPersons(q),
    enabled: q.length >= PERSON_SEARCH_MIN,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

export const usePersonSearch = (q: string) => useQuery(personSearchQueryOptions(q.trim()));
