import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const categorySchema = z.object({ id: z.number(), name: z.string(), slug: z.string() }).passthrough();

export const announcementSummarySchema = z.object({
  id: z.string(),
  content_type: z.string(),
  title: z.string(),
  excerpt: z.string(),
  category: categorySchema.nullable(),
  author_name: z.string(),
  scope: z.object({ node_id: z.string().nullable(), node_name: z.string().nullable(), place_name: z.string().nullable() }).passthrough(),
  is_sunday_notice: z.boolean(),
  sunday_date: z.string().nullable(),
  published_at: z.string().nullable(),
});
export type AnnouncementSummary = z.infer<typeof announcementSummarySchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(announcementSummarySchema) });

export const ANNOUNCEMENTS_LIMIT = 20;

/** Annonces publiées de la paroisse et de ses lieux (`node` = nœud et sous-arbre), récentes d'abord. */
export const getAnnouncements = async (nodeId: string) =>
  pageSchema.parse(await api.get('/news/', { params: { node: nodeId, type: 'announcement', limit: ANNOUNCEMENTS_LIMIT } }));

export const announcementsQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['paroisse', nodeId, 'annonces'], queryFn: () => getAnnouncements(nodeId) });

export const useAnnouncements = (nodeId: string | null) =>
  useQuery({ ...announcementsQueryOptions(nodeId ?? ''), enabled: Boolean(nodeId) });
