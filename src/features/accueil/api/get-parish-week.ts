import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Doublon assumé de la feature `paroisse` : l'accueil ne lit que les prochaines messes.
const occurrenceSchema = z.object({
  date: z.string(),
  kind: z.string(),
  start_time: z.string(),
  end_time: z.string().nullable(),
  place_id: z.number(),
  place_name: z.string(),
  language: z.string(),
  note: z.string(),
  is_exception: z.boolean(),
});
export type MassOccurrence = z.infer<typeof occurrenceSchema>;

const weekSchema = z.object({ occurrences: z.array(occurrenceSchema) });

/** Semaine des horaires (7 jours dès aujourd'hui), exceptions comprises. */
export const getParishWeek = async (nodeId: string) =>
  weekSchema.parse(await api.get(`/public/nodes/${encodeURIComponent(nodeId)}/week/`));

export const parishWeekQueryOptions = (nodeId: string) =>
  queryOptions({ queryKey: ['accueil', nodeId, 'semaine'], queryFn: () => getParishWeek(nodeId), staleTime: 10 * 60 * 1000 });

export const useParishWeek = (nodeId: string | null) => useQuery({ ...parishWeekQueryOptions(nodeId ?? ''), enabled: Boolean(nodeId) });
