import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const nodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  city: z.string().nullish(),
  address: z.string().nullish(),
  is_active_on_platform: z.boolean(),
  deanery_name: z.string().nullish(),
  diocese_name: z.string().nullish(),
});
export type DirectoryParish = z.infer<typeof nodeSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(nodeSchema) });

/** Paroisses de l'annuaire public (tout un diocèse, ou une recherche), paroisses ouvertes d'abord. */
export const getParishChoices = async ({ q, diocese }: { q: string; diocese: string }, signal?: AbortSignal) => {
  const page = pageSchema.parse(
    await api.get('/public/nodes/', { params: { type: 'paroisse', q: q || undefined, diocese: diocese || undefined, limit: 50 }, signal }),
  );
  return { ...page, results: [...page.results].sort((a, b) => Number(b.is_active_on_platform) - Number(a.is_active_on_platform)) };
};

export const useParishChoices = (params: { q: string; diocese: string }) =>
  useQuery(
    queryOptions({
      queryKey: ['onboarding', 'parishes', params],
      queryFn: ({ signal }) => getParishChoices(params, signal),
      placeholderData: keepPreviousData,
      staleTime: 5 * 60 * 1000,
    }),
  );

/** Diocèses (pilules de filtre du choix de paroisse). */
export const getDioceses = async () => pageSchema.parse(await api.get('/public/nodes/', { params: { type: 'diocese', limit: 50 } })).results;

export const useDioceses = () => useQuery({ queryKey: ['onboarding', 'dioceses'], queryFn: getDioceses, staleTime: 30 * 60 * 1000 });
