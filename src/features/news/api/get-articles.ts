import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { Article, articleSchema } from '../types';

export type GetArticlesParams = {
  limit?: number;
  offset?: number;
};
export type ArticlesResponse = { count: number; results: Article[] };

const parseArticles = (data: unknown): ArticlesResponse => {
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count,
    results: raw.results.map((item) => articleSchema.parse(item)),
  };
};

export const getGlobalArticles = (
  params?: GetArticlesParams,
): Promise<ArticlesResponse> =>
  api.get<unknown>('/v1/news/', { params }).then(parseArticles);

export const getParishArticles = (
  params?: GetArticlesParams,
): Promise<ArticlesResponse> =>
  api.get<unknown>('/v1/news/my-parish/', { params }).then(parseArticles);

export const getDioceseArticles = (
  dioceseId: number,
  params?: GetArticlesParams,
): Promise<ArticlesResponse> =>
  api
    .get<unknown>(`/v1/news/diocese/${dioceseId}/`, { params })
    .then(parseArticles);

export const getGlobalArticlesQueryOptions = (params?: GetArticlesParams) =>
  queryOptions({
    queryKey: ['articles', 'global', params],
    queryFn: () => getGlobalArticles(params),
  });

export const getParishArticlesQueryOptions = (params?: GetArticlesParams) =>
  queryOptions({
    queryKey: ['articles', 'parish', params],
    queryFn: () => getParishArticles(params),
  });

export const getDioceseArticlesQueryOptions = (
  dioceseId: number,
  params?: GetArticlesParams,
) =>
  queryOptions({
    queryKey: ['articles', 'diocese', dioceseId, params],
    queryFn: () => getDioceseArticles(dioceseId, params),
    enabled: !!dioceseId,
  });

export const useGlobalArticles = (params?: GetArticlesParams) =>
  useQuery(getGlobalArticlesQueryOptions(params));

export const useParishArticles = (params?: GetArticlesParams) =>
  useQuery(getParishArticlesQueryOptions(params));

export const useDioceseArticles = (
  dioceseId: number | undefined,
  params?: GetArticlesParams,
) => useQuery(getDioceseArticlesQueryOptions(dioceseId ?? 0, params));
