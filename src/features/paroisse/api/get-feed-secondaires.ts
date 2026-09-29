import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { announcementSummarySchema } from './get-announcements';

// Fil des paroisses secondaires (paroisses multiples, décisions V2 6-8, backend
// API-AUDIO §9) : `GET /me/feed/secondaires/?paroisse=<id>`, annonces de ces paroisses et de
// leur sous-arbre, triées par date, sans notification.

const pageSchema = z.object({
  count: z.number(),
  results: z.array(announcementSummarySchema),
});

export const useFeedSecondaires = (
  paroisse: string | null,
  { enabled = true } = {},
) =>
  useQuery({
    queryKey: ['paroisse', 'secondaires', paroisse ?? 'toutes'],
    queryFn: async () =>
      pageSchema.parse(
        await api.get('/me/feed/secondaires/', {
          params: { paroisse: paroisse ?? undefined, limit: 20 },
        }),
      ),
    enabled,
    placeholderData: keepPreviousData,
  });
