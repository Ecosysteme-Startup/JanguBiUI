import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const priestSchema = z.object({
  user_id: z.string(),
  full_name: z.string(),
  nodes: z.array(z.object({ id: z.string(), name: z.string(), type: z.string() })),
  availability: z.object({ accepts_new_conversations: z.boolean() }).passthrough().nullable(),
});
export type ReachablePriest = z.infer<typeof priestSchema>;

/** Prêtres joignables par message depuis ma paroisse suivie (et aumôneries du diocèse). */
export const getParishPriests = async () => z.array(priestSchema).parse(await api.get('/messaging/priests/'));

export const parishPriestsQueryOptions = () =>
  queryOptions({ queryKey: ['paroisse', 'pretres'], queryFn: getParishPriests, staleTime: 10 * 60 * 1000 });

export const useParishPriests = () => useQuery(parishPriestsQueryOptions());
