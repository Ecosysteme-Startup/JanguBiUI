import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type StaffArticle, staffArticleKey, staffArticleSchema } from './staff-article';

export const getStaffArticle = async (articleId: string): Promise<StaffArticle> =>
  staffArticleSchema.parse(await api.get(`/staff/news/${encodeURIComponent(articleId)}/`));

export const staffArticleQueryOptions = (articleId: string) =>
  queryOptions({ queryKey: staffArticleKey(articleId), queryFn: () => getStaffArticle(articleId) });

export const useStaffArticle = (articleId: string | null) =>
  useQuery({ ...staffArticleQueryOptions(articleId ?? ''), enabled: Boolean(articleId) });
