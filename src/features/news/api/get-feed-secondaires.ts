import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Fil séparé des paroisses secondaires (décisions 6-8, backend
// `docs/API-AUDIO.md` §9) : `GET /me/feed/secondaires/?paroisse=<id>`, même
// format paginé que `GET /me/feed/` (ArticleListOutputSerializer). Annonces de
// ces paroisses et de leur sous-arbre seulement, triées par date, sans
// notification.

export const annonceSecondaireSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string().nullish(),
  content_type: z.string().nullish(),
  category: z.object({ id: z.number(), name: z.string() }).nullish(),
  author_name: z.string().nullish(),
  scope: z
    .object({
      node_id: z.string().nullish(),
      node_name: z.string().nullish(),
    })
    .nullish(),
  cover_image_url: z.string().nullish(),
  published_at: z.string().nullish(),
});
export type AnnonceSecondaire = z.infer<typeof annonceSecondaireSchema>;

const pageSchema = z.object({
  count: z.number(),
  results: z.array(annonceSecondaireSchema),
});
export type PageAnnoncesSecondaires = z.infer<typeof pageSchema>;

export const getFeedSecondaires = async ({
  paroisse,
  limit = 20,
}: {
  paroisse?: string | null;
  limit?: number;
}): Promise<PageAnnoncesSecondaires> =>
  pageSchema.parse(
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
