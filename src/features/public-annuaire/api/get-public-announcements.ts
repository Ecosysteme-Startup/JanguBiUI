import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const announcementSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string().default(''),
  category: z.object({ name: z.string() }).nullable().optional(),
  author_name: z.string().default(''),
  scope: z.object({ node_name: z.string().nullable() }).partial().nullable().optional(),
  is_sunday_notice: z.boolean().default(false),
  sunday_date: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  cover_image_url: z.string().nullable().catch(null),
  cover_image_alt: z.string().catch(''),
  cover_image_decorative: z.boolean().catch(false),
});
export type PublicAnnouncement = z.infer<typeof announcementSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(announcementSchema) });

/** Annonces publiées d'un nœud et de son sous-arbre, ou de toute la plateforme (`GET /news/`). */
export const getPublicAnnouncements = async ({ nodeId, limit }: { nodeId?: string; limit: number }) =>
  pageSchema.parse(await api.get('/news/', { params: { node: nodeId, type: 'announcement', limit } }));

export const publicAnnouncementsQueryOptions = ({ nodeId, limit = 3 }: { nodeId?: string; limit?: number }) =>
  queryOptions({
    queryKey: ['public', 'announcements', nodeId ?? 'all', limit],
    queryFn: () => getPublicAnnouncements({ nodeId, limit }),
    staleTime: 5 * 60 * 1000,
  });

export const usePublicAnnouncements = (options: { nodeId?: string; limit?: number }) => useQuery(publicAnnouncementsQueryOptions(options));
