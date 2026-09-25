import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const coordinate = z.union([z.string(), z.number()]).nullable().optional();

export const directoryNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  type: z.object({ code: z.string(), label: z.string() }).optional(),
  status: z.string().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  lat: coordinate,
  lng: coordinate,
  is_active_on_platform: z.boolean(),
  parent_id: z.string().nullable().optional(),
});
export type DirectoryNode = z.infer<typeof directoryNodeSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(directoryNodeSchema) });
export type DirectoryPage = z.infer<typeof pageSchema>;

export type DirectoryParams = {
  q?: string;
  city?: string;
  /** Sous-arbre d'un nœud (diocèse ou doyenné). */
  diocese?: string;
  type?: string;
  on_platform?: boolean;
  limit?: number;
  offset?: number;
};

/** Annuaire public (`GET /public/nodes/`) : recherche par nom, ville ou code, sous-arbre. */
export const getDirectory = async (params: DirectoryParams, signal?: AbortSignal): Promise<DirectoryPage> =>
  pageSchema.parse(await api.get('/public/nodes/', { params: { type: 'paroisse', ...params }, signal }));

export const directoryQueryOptions = (params: DirectoryParams) =>
  queryOptions({
    queryKey: ['public', 'directory', params],
    queryFn: ({ signal }) => getDirectory(params, signal),
    staleTime: 5 * 60 * 1000,
  });

export const useDirectory = (params: DirectoryParams) => useQuery({ ...directoryQueryOptions(params), placeholderData: keepPreviousData });

/** Diocèses du Sénégal (sélecteurs de l'annuaire et du formulaire de contact). */
export const diocesesQueryOptions = () => directoryQueryOptions({ type: 'diocese', limit: 50 });

export const useDioceses = () => useQuery(diocesesQueryOptions());

/** Doyennés d'un diocèse. */
export const doyennesQueryOptions = (dioceseId: string) => directoryQueryOptions({ type: 'doyenne', diocese: dioceseId, limit: 50 });

export const useDoyennes = (dioceseId: string | undefined) =>
  useQuery({ ...doyennesQueryOptions(dioceseId ?? ''), enabled: Boolean(dioceseId) });

/** Extrait d'annuaire de l'accueil : six fiches, et le nombre de paroisses ouvertes. */
export const EXCERPT_PARAMS: DirectoryParams = { limit: 6 };
export const ACTIVE_COUNT_PARAMS: DirectoryParams = { on_platform: true, limit: 1 };

/** Requêtes à précharger côté serveur pour l'extrait d'annuaire (appelable depuis un composant serveur). */
export const directoryExcerptQueries = () => [directoryQueryOptions(EXCERPT_PARAMS), directoryQueryOptions(ACTIVE_COUNT_PARAMS)];
