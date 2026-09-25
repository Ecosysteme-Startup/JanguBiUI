import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { announcementSummarySchema } from './get-announcements';

const announcementSchema = announcementSummarySchema.extend({
  content: z.string(),
  content_format: z.enum(['text', 'html']).catch('text'),
  cover_image_url: z.string().nullable().optional(),
});
export type Announcement = z.infer<typeof announcementSchema>;

export const getAnnouncement = async (id: string): Promise<Announcement> =>
  announcementSchema.parse(await api.get(`/news/${encodeURIComponent(id)}/`));

export const announcementQueryOptions = (id: string) =>
  queryOptions({ queryKey: ['annonces', id], queryFn: () => getAnnouncement(id) });

export const useAnnouncement = (id: string) => useQuery(announcementQueryOptions(id));

/** Une lecture par personne (compteur réservé au staff, EF-PAROI-05). */
export const markAnnouncementRead = (id: string) => api.post(`/news/${encodeURIComponent(id)}/read/`);

export const useMarkAnnouncementRead = () => useMutation({ mutationFn: markAnnouncementRead });
