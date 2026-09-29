import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// `GET /v1/messaging/priests/` (ReachablePriestOutput) : prêtres joignables
// des paroisses du fidèle, avec leur disponibilité.
const availabilitySchema = z.object({
  accepts_new_conversations: z.boolean().default(true),
  absent_until: z.string().nullable().optional(),
  reply_windows: z.array(z.unknown()).default([]),
  note: z.string().default(''),
});

const priestSchema = z.object({
  user_id: z.string(),
  full_name: z.string(),
  nodes: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.string().optional(),
      }),
    )
    .default([]),
  availability: availabilitySchema.nullable(),
  office: z.object({ code: z.string(), label: z.string() }).nullable(),
});

export type Priest = z.infer<typeof priestSchema>;

/** Sans réglage de disponibilité, le prêtre accepte les nouveaux échanges. */
export const acceptsNewConversations = (p: Priest): boolean =>
  p.availability?.accepts_new_conversations ?? true;

export const getPriests = (): Promise<Priest[]> =>
  api
    .get<unknown>('/v1/messaging/priests/')
    .then((data) => z.array(priestSchema).parse(data));

export const getPriestsQueryOptions = () =>
  queryOptions({
    queryKey: ['priests'],
    queryFn: getPriests,
  });

export const usePriests = () => useQuery(getPriestsQueryOptions());
