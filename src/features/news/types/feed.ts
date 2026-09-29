import { z } from 'zod';

// Article d'un fil de la personne (`GET /me/feed/` et `GET /me/feed/secondaires/`),
// contrat réel du backend : `apps/news/serializers.ArticleListOutputSerializer`,
// enveloppe paginée LimitOffset. Aucun compteur de lectures (réservé au staff).

export const feedArticleSchema = z.object({
  id: z.string(),
  content_type: z.string().nullish(),
  title: z.string(),
  slug: z.string().nullish(),
  excerpt: z.string().nullish(),
  content_format: z.string().nullish(),
  category: z
    .object({
      id: z.number(),
      name: z.string(),
      slug: z.string().nullish(),
      icon: z.string().nullish(),
      color: z.string().nullish(),
    })
    .nullish(),
  author_name: z.string().nullish(),
  /** Portée : `node_id` / `node_name` à `null` pour un contenu global. */
  scope: z
    .object({
      node_id: z.string().nullish(),
      node_name: z.string().nullish(),
      place_id: z.number().nullish(),
      place_name: z.string().nullish(),
    })
    .nullish(),
  is_sunday_notice: z.boolean().nullish(),
  // Épinglage (API-V1-COMPLEMENTS §2.1) : épinglés d'abord dans le fil.
  is_pinned: z.boolean().nullish(),
  pinned_until: z.string().nullish(),
  sunday_date: z.string().nullish(),
  cover_image_url: z.string().nullish(),
  cover_image_alt: z.string().nullish(),
  cover_image_decorative: z.boolean().nullish(),
  published_at: z.string().nullish(),
  reactions: z
    .object({
      counts: z.record(z.number()).default({}),
      mine: z.array(z.string()).default([]),
    })
    .nullish(),
});
export type FeedArticle = z.infer<typeof feedArticleSchema>;

export const feedPageSchema = z.object({
  count: z.number(),
  next: z.string().nullish(),
  previous: z.string().nullish(),
  results: z.array(feedArticleSchema),
});
export type FeedPage = z.infer<typeof feedPageSchema>;
