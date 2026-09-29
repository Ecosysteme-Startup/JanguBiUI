import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Doublon assumé de la feature `paroisse` : l'accueil n'affiche que les trois dernières annonces.
const announcementSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string(),
  category: z.object({ id: z.number(), name: z.string() }).passthrough().nullable(),
  is_sunday_notice: z.boolean(),
  published_at: z.string().nullable(),
});
export type HomeAnnouncement = z.infer<typeof announcementSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(announcementSchema) });

export const HOME_ANNOUNCEMENTS = 3;

/** Dernières annonces publiées de la paroisse suivie et de ses lieux. */
export const getAnnouncements = async (nodeId: string) =>
  pageSchema.parse(await api.get('/news/', { params: { node: nodeId, type: 'announcement', limit: HOME_ANNOUNCEMENTS } }));

export const announcementsQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['accueil', nodeId, 'annonces'], queryFn: () => getAnnouncements(nodeId) });

export const useAnnouncements = (nodeId: string | null) =>
  useQuery({ ...announcementsQueryOptions(nodeId ?? ''), enabled: Boolean(nodeId) });
