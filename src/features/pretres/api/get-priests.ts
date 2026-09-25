import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

/** `ReachablePriestOutputSerializer` : prêtres joignables de la paroisse suivie et des aumôneries du diocèse. */
const priestSchema = z.object({
  user_id: z.string(),
  full_name: z.string(),
  nodes: z.array(
    z.object({ id: z.string(), name: z.string(), type: z.string() }),
  ),
  availability: z
    .object({
      accepts_new_conversations: z.boolean().default(true),
      absent_until: z.string().nullable().default(null),
      reply_windows: z
        .array(
          z.object({
            weekday: z.coerce.number(),
            start: z.string(),
            end: z.string(),
          }),
        )
        .default([]),
      note: z.string().default(''),
    })
    .nullable(),
});
export type ReachablePriest = z.infer<typeof priestSchema>;

export const getPriests = async (): Promise<ReachablePriest[]> =>
  z.array(priestSchema).parse(await api.get('/messaging/priests/'));

export const priestsQueryOptions = () =>
  queryOptions({ queryKey: ['pretres', 'joignables'], queryFn: getPriests });

export const usePriests = () => useQuery(priestsQueryOptions());
