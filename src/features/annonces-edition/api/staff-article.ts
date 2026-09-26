import { z } from 'zod';

import type { Expect, Matches, ResponseBody } from '@/types/api-contract';

export const ARTICLE_STATUSES = ['draft', 'scheduled', 'published', 'unpublished'] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const staffArticleSchema = z.object({
  id: z.string(),
  content_type: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  content: z.string(),
  content_format: z.enum(['text', 'html']),
  category: z.object({ id: z.number(), name: z.string() }).passthrough().nullable(),
  author_name: z.string(),
  scope: z.object({
    node_id: z.string().nullable(),
    node_name: z.string().nullable(),
    place_id: z.number().nullable(),
    place_name: z.string().nullable(),
  }),
  is_sunday_notice: z.boolean(),
  sunday_date: z.string().nullable(),
  status: z.enum(ARTICLE_STATUSES),
  publish_at: z.string().nullable(),
  published_at: z.string().nullable(),
  unpublished_at: z.string().nullable(),
  unpublish_reason: z.string(),
  cover_image_id: z.number().nullable(),
  cover_image_url: z.string().nullable(),
  notify_followers: z.boolean(),
  reads_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type StaffArticle = z.infer<typeof staffArticleSchema>;

// Garde de contrat : les clés lues ici existent dans la réponse du serveur.
type _StaffArticleKeys = Expect<
  Matches<Exclude<keyof StaffArticle, keyof ResponseBody<'v1_staff_news_retrieve'>>, never>
>;

export const staffArticleKey = (articleId: string) => ['staff', 'news', 'detail', articleId] as const;
export const staffNewsKey = ['staff', 'news'] as const;
