import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type FeedArticle, type FeedPage, feedPageSchema } from '../types/feed';

// Fil séparé des paroisses secondaires (décisions 6-8, backend
// `docs/API-AUDIO.md` §9) : `GET /me/feed/secondaires/?paroisse=<id>`, même
// format paginé que `GET /me/feed/` (ArticleListOutputSerializer). Annonces de
// ces paroisses et de leur sous-arbre seulement, triées par date, sans
// notification.

export type AnnonceSecondaire = FeedArticle;
export type PageAnnoncesSecondaires = FeedPage;

export const getFeedSecondaires = async ({
  paroisse,
  limit = 20,
}: {
  paroisse?: string | null;
  limit?: number;
}): Promise<PageAnnoncesSecondaires> =>
  feedPageSchema.parse(
    await api.get<unknown>('/v1/me/feed/secondaires/', {
      params: { paroisse: paroisse ?? undefined, limit },
    }),
  );

export const useFeedSecondaires = (
  paroisse: string | null,
  { enabled = true } = {},
) =>
  useQuery({
    queryKey: ['articles', 'secondaires', paroisse ?? 'toutes'],
    queryFn: () => getFeedSecondaires({ paroisse }),
    enabled,
    placeholderData: keepPreviousData,
  });
