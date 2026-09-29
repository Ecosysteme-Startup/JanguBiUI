import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const lectioDivinaSchema = z.object({
  id: z.number(),
  passage_id: z.number().nullable(),
  session_date: z.string().optional(),
  lectio: z.string(),
  meditatio: z.string(),
  oratio: z.string(),
  contemplatio: z.string(),
  updated_at: z.string(),
});

export type LectioDivinaSession = z.infer<typeof lectioDivinaSchema>;

type SessionsResponse = { count: number; results: LectioDivinaSession[] };

const parseSessions = (data: unknown): SessionsResponse => {
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count,
    results: raw.results.map((item) => lectioDivinaSchema.parse(item)),
  };
};

export const getLectioSessions = (): Promise<SessionsResponse> =>
  api.get<unknown>('/v1/bible/lectio/').then(parseSessions);

export const getLectioSessionsQueryOptions = () =>
  queryOptions({ queryKey: ['lectio-sessions'], queryFn: getLectioSessions });

export const useLectioSessions = () =>
  useQuery(getLectioSessionsQueryOptions());
