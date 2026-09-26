import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { type ArticleStatus, staffArticleSchema, staffNewsKey } from './staff-article';

const pageSchema = z.object({ count: z.number(), results: z.array(staffArticleSchema) });
export type StaffNewsPage = z.infer<typeof pageSchema>;

export type StaffNewsFilters = {
  status?: ArticleStatus;
  type?: 'announcement' | 'article';
  /** Recherche dans le titre, le chapô et le texte. */
  q?: string;
  /** Lieu de culte de l'annonce. */
  place?: number;
  limit: number;
  offset: number;
};

/** Contenus du nœud et de son sous-arbre, tous statuts (annonces.publier). */
export const getStaffNews = async (nodeId: string, filters: StaffNewsFilters): Promise<StaffNewsPage> =>
  pageSchema.parse(await api.get('/staff/news/', { params: { node: nodeId, ...filters } }));

export const staffNewsQueryOptions = (nodeId: string, filters: StaffNewsFilters) =>
  queryOptions({
    queryKey: [...staffNewsKey, nodeId, filters],
    queryFn: () => getStaffNews(nodeId, filters),
    placeholderData: keepPreviousData,
  });

export const useStaffNews = (nodeId: string, filters: StaffNewsFilters) => useQuery(staffNewsQueryOptions(nodeId, filters));

export type StaffNewsCounts = Record<'all' | ArticleStatus, number>;

/** Compteurs des onglets : quatre lectures légères en parallèle (`limit=1`), pas d'endpoint dédié. */
export const getStaffNewsCounts = async (nodeId: string): Promise<StaffNewsCounts> => {
  const count = async (status?: ArticleStatus) => (await getStaffNews(nodeId, { status, limit: 1, offset: 0 })).count;
  const [all, published, scheduled, draft] = await Promise.all([count(), count('published'), count('scheduled'), count('draft')]);
  return { all, published, scheduled, draft, unpublished: all - published - scheduled - draft };
};

export const useStaffNewsCounts = (nodeId: string) =>
  useQuery({ queryKey: [...staffNewsKey, nodeId, 'counts'], queryFn: () => getStaffNewsCounts(nodeId) });
