import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Tâches du jour — backend `docs/API-V1-COMPLEMENTS.md` §2.5
// (`GET /v1/staff/taches-du-jour/?node=&date=`). Chaque rubrique n'apparaît
// qu'avec la capacité correspondante ; jamais le nom d'un pénitent.

export const tachesDuJourSchema = z.object({
  node: z.object({ id: z.string(), name: z.string() }),
  date: z.string(),
  tasks: z.array(
    z.object({ code: z.string(), label: z.string(), count: z.number() }),
  ),
  confessions: z
    .array(
      z.object({
        slot_id: z.number(),
        starts_at: z.string(),
        ends_at: z.string(),
        place_name: z.string().default(''),
        priest_name: z.string().default(''),
        reserved: z.boolean(),
      }),
    )
    .nullable(),
});
export type TachesDuJour = z.infer<typeof tachesDuJourSchema>;

export const useTachesDuJour = (node: string | undefined) =>
  useQuery({
    queryKey: ['staff', 'taches-du-jour', node],
    queryFn: async () =>
      tachesDuJourSchema.parse(
        await api.get<unknown>('/v1/staff/taches-du-jour/', {
          params: { node },
          quiet: true,
        }),
      ),
    enabled: !!node,
    staleTime: 60_000,
  });
