import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Fil du fidèle (EF-PAROI-04) : `GET /me/feed/?limit=&offset=` (opération `me_feed`), enveloppe
// `PaginatedArticleListOutputList`. Contenus globaux (Jàngu Bi), de la paroisse principale et de
// ses ancêtres (doyenné, diocèse…), épinglés en tête (`is_pinned`, API-V1-COMPLEMENTS §2.1).
// Doublon assumé de la feature `paroisse` : l'accueil ne lit que ce qu'il affiche.

const feedItemSchema = z.object({
  id: z.string(),
  content_type: z.string().optional(),
  title: z.string(),
  excerpt: z.string().optional().default(''),
  category: z.object({ id: z.number(), name: z.string() }).passthrough().nullable(),
  /** Portée : `node_id` et `node_name` à `null` pour un contenu global de la plateforme. */
  scope: z
    .object({ node_id: z.string().nullish(), node_name: z.string().nullish() })
    .passthrough()
    .nullish(),
  is_sunday_notice: z.boolean().optional().default(false),
  is_pinned: z.boolean().optional().default(false),
  published_at: z.string().nullish(),
});
export type FeedItem = z.infer<typeof feedItemSchema>;

const feedPageSchema = z.object({
  count: z.number(),
  next: z.string().nullish(),
  previous: z.string().nullish(),
  results: z.array(feedItemSchema),
});
export type FeedPage = z.infer<typeof feedPageSchema>;

/** Nombre d'annonces de l'accueil (« Dernières annonces »). */
export const HOME_FEED_LIMIT = 3;

/** Épinglés d'abord, ordre du serveur conservé à l'intérieur de chaque groupe. */
export const pinnedFirst = <T extends { is_pinned?: boolean }>(items: T[]): T[] => [
  ...items.filter((item) => item.is_pinned),
  ...items.filter((item) => !item.is_pinned),
];

/** Provenance affichée : le nœud émetteur (paroisse, doyenné, diocèse) ou « Jàngu Bi » (contenu global). */
export const feedOrigin = (item: Pick<FeedItem, 'scope'>) => (item.scope?.node_id ? (item.scope.node_name ?? '') : 'Jàngu Bi');

export const getMeFeed = async ({ limit = HOME_FEED_LIMIT, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<FeedPage> => {
  const page = feedPageSchema.parse(await api.get('/me/feed/', { params: { limit, offset } }));
  return { ...page, results: pinnedFirst(page.results) };
};

export const meFeedQueryOptions = ({ limit = HOME_FEED_LIMIT, offset = 0 } = {}) =>
  queryOptions({
    queryKey: ['accueil', 'me-feed', { limit, offset }],
    queryFn: () => getMeFeed({ limit, offset }),
    placeholderData: keepPreviousData,
  });

export const useMeFeed = ({ limit = HOME_FEED_LIMIT, offset = 0 } = {}) => useQuery(meFeedQueryOptions({ limit, offset }));
