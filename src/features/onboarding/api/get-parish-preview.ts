import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const occurrenceSchema = z.object({
  date: z.string(),
  kind: z.string(),
  start_time: z.string(),
  place_name: z.string(),
  note: z.string().default(''),
});
export type PreviewOccurrence = z.infer<typeof occurrenceSchema>;

const weekSchema = z.object({ occurrences: z.array(occurrenceSchema) });
const newsSchema = z.object({ results: z.array(z.object({ id: z.string(), title: z.string(), excerpt: z.string().default('') })) });

/** Horaires des sept prochains jours d'une paroisse (`GET /public/nodes/{id}/week/`). */
export const usePreviewWeek = (nodeId: string | undefined) =>
  useQuery({
    queryKey: ['onboarding', 'week', nodeId],
    queryFn: async () => weekSchema.parse(await api.get(`/public/nodes/${encodeURIComponent(nodeId ?? '')}/week/`)),
    enabled: Boolean(nodeId),
    staleTime: 5 * 60 * 1000,
  });

/** Dernière annonce publique d'une paroisse (`GET /news/?node=`). */
export const usePreviewAnnouncement = (nodeId: string | undefined) =>
  useQuery({
    queryKey: ['onboarding', 'news', nodeId],
    queryFn: async () => newsSchema.parse(await api.get('/news/', { params: { node: nodeId, type: 'announcement', limit: 1 } })).results[0] ?? null,
    enabled: Boolean(nodeId),
    staleTime: 5 * 60 * 1000,
  });
