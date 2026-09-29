import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// `type_display` : libellé français servi par le backend (« Je vous salue Marie »).
const prayerSchema = z.object({ id: z.union([z.string(), z.number()]), type: z.string(), type_display: z.string(), text: z.string() });
export type Prayer = z.infer<typeof prayerSchema>;

const mysterySchema = z.object({
  id: z.union([z.string(), z.number()]),
  order: z.number(),
  title: z.string(),
  meditation: z.string().nullable(),
  meditation_source: z.string().nullable().optional(),
  // Grâce demandée en priant le mystère (« la confiance »).
  fruit: z.string(),
  prayers: z.array(z.object({ order: z.number(), prayer: prayerSchema })),
});
export type Mystery = z.infer<typeof mysterySchema>;

const rosaryTodaySchema = z.object({
  day: z.object({
    weekday: z.number(),
    weekday_display: z.string(),
    group: z.object({ name: z.string(), slug: z.string(), mysteries: z.array(mysterySchema) }),
  }),
  standalone_prayers: z.array(prayerSchema),
});
export type RosaryToday = z.infer<typeof rosaryTodaySchema>;

/**
 * Partagé par l'accueil (carte « chapelet ») et la feature chapelet : une seule clé, un seul
 * schéma. Deux schémas sur la même clé faisaient lire au chapelet une version tronquée
 * (sans prières d'ouverture) mise en cache par l'accueil.
 *
 * Mystères du jour et prières d'ouverture/de clôture (`TodayRosaryApi`, public). */
export const getRosaryToday = async (signal?: AbortSignal): Promise<RosaryToday> =>
  rosaryTodaySchema.parse(await api.get('/rosary/today/', { signal }));

export const rosaryTodayQueryOptions = () =>
  queryOptions({ queryKey: ['rosary', 'today'], queryFn: ({ signal }) => getRosaryToday(signal), staleTime: 60 * 60 * 1000 });

export const useRosaryToday = () => useQuery(rosaryTodayQueryOptions());
