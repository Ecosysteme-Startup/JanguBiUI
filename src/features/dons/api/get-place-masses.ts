import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { Expect, Matches, ResponseBody } from '@/types/api-contract';

/** Horaire de la semaine type d'un lieu ; `weekday` : 0 = lundi … 6 = dimanche (contrat `WeekdayEnum`). */
const scheduleSchema = z.object({
  id: z.number(),
  kind: z.enum(['messe', 'confession', 'adoration']),
  weekday: z.number().int().min(0).max(6),
  start_time: z.string(),
  note: z.string().optional().default(''),
  valid_from: z.string().nullable().optional().default(null),
  valid_to: z.string().nullable().optional().default(null),
});
export type MassTime = z.infer<typeof scheduleSchema>;

type _Keys = Expect<Matches<Exclude<keyof MassTime, keyof ResponseBody<'v1_hierarchy_places_schedule_list'>[number]>, never>>;
export type PlaceMassesGuard = _Keys;

/** Messes de la semaine type d'un lieu (lecture publique) : alimente le choix de la messe d'une quête. */
export const getPlaceMasses = async (placeId: number): Promise<MassTime[]> =>
  z
    .array(scheduleSchema)
    .parse(await api.get(`/hierarchy/places/${placeId}/schedule/`))
    .filter((s) => s.kind === 'messe');

export const placeMassesQueryOptions = (placeId: number) =>
  queryOptions({ queryKey: ['dons', 'lieux', placeId, 'messes'], queryFn: () => getPlaceMasses(placeId), staleTime: 30 * 60 * 1000 });

export const usePlaceMasses = (placeId: number | null) =>
  useQuery({ ...placeMassesQueryOptions(placeId ?? 0), enabled: placeId !== null && placeId > 0 });
