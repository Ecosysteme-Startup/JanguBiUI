import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type StaffArticle, staffArticleKey, staffArticleSchema, staffNewsKey } from './staff-article';

export type ArticleCreateBody = RequestBody<'v1_staff_news_create'>;
export type ArticleUpdateBody = RequestBody<'v1_staff_news_partial_update'>;
type PublishBody = RequestBody<'v1_staff_news_publish_create'>;
type UnpublishBody = RequestBody<'v1_staff_news_unpublish_create'>;

const base = (id: string) => `/staff/news/${encodeURIComponent(id)}/`;

export const createArticle = async (body: ArticleCreateBody): Promise<StaffArticle> =>
  staffArticleSchema.parse(await api.post('/staff/news/', body));

export const updateArticle = async (id: string, body: ArticleUpdateBody): Promise<StaffArticle> =>
  staffArticleSchema.parse(await api.patch(base(id), body));

/**
 * Publie tout de suite (`publishAt` absent ou passé) ou programme la publication.
 * `notify` : prévenir les fidèles (le serveur applique leurs préférences et la plage de silence).
 */
export const publishArticle = async (id: string, publishAt: string | null, notify?: boolean): Promise<StaffArticle> => {
  const body: PublishBody = { ...(publishAt ? { publish_at: publishAt } : {}), ...(notify === undefined ? {} : { notify }) };
  return staffArticleSchema.parse(await api.post(`${base(id)}publish/`, body));
};

export const unpublishArticle = async (id: string, reason: string): Promise<StaffArticle> => {
  const body: UnpublishBody = { reason };
  return staffArticleSchema.parse(await api.post(`${base(id)}unpublish/`, body));
};

export const deleteArticle = (id: string): Promise<void> => api.delete(base(id));

export type SaveArticleInput =
  | { id: null; create: ArticleCreateBody; publish?: { at: string | null; notify?: boolean } }
  | { id: string; update: ArticleUpdateBody; publish?: { at: string | null; notify?: boolean } };

/**
 * Enregistre (création du brouillon ou modification), puis publie ou programme si demandé.
 * Deux appels successifs : le brouillon reste enregistré même si la publication échoue.
 */
export const saveArticle = async (input: SaveArticleInput): Promise<StaffArticle> => {
  const saved = input.id === null ? await createArticle(input.create) : await updateArticle(input.id, input.update);
  return input.publish ? publishArticle(saved.id, input.publish.at, input.publish.notify) : saved;
};

const useInvalidateNews = () => {
  const queryClient = useQueryClient();
  return async (article?: StaffArticle) => {
    if (article) queryClient.setQueryData(staffArticleKey(article.id), article);
    await queryClient.invalidateQueries({ queryKey: staffNewsKey });
  };
};

export const useSaveArticle = ({ onSuccess }: { onSuccess?: (article: StaffArticle, input: SaveArticleInput) => void } = {}) => {
  const invalidate = useInvalidateNews();
  return useMutation({
    mutationFn: saveArticle,
    onSuccess: async (article, input) => {
      await invalidate(article);
      onSuccess?.(article, input);
    },
  });
};

export const useUnpublishArticle = ({ onSuccess }: { onSuccess?: (article: StaffArticle) => void } = {}) => {
  const invalidate = useInvalidateNews();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => unpublishArticle(id, reason),
    onSuccess: async (article) => {
      await invalidate(article);
      onSuccess?.(article);
    },
  });
};

export const useDeleteArticle = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const invalidate = useInvalidateNews();
  return useMutation({
    mutationFn: deleteArticle,
    onSuccess: async () => {
      await invalidate();
      onSuccess?.();
    },
  });
};
