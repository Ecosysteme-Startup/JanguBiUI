import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { aelfLectureSchema } from '@/utils/aelf';

// Forme renvoyée par `apps/liturgy/selectors.liturgy_day` (le schéma OpenAPI la déclare en OBJECT).
const verseSchema = z.object({ book: z.string(), chapter: z.number(), number: z.number(), text: z.string() });
export type ReadingVerse = z.infer<typeof verseSchema>;

const readingSchema = z.object({
  type: z.string(),
  citation: z.string(),
  text: z.string().nullable(),
  verses: z.array(verseSchema),
  // Lecture AELF brute (titre, intro_lue, refrain_psalmique…), telle que servie par l'API.
  aelf: aelfLectureSchema,
});
export type Reading = z.infer<typeof readingSchema>;

const liturgyDaySchema = z.object({
  date: z.string(),
  calendar: z.object({
    liturgical_year: z.number(),
    season: z.string(),
    season_label: z.string(),
    week: z.number().nullable(),
    celebration: z.string(),
    rank: z.string(),
    color: z.string(),
    sunday_cycle: z.string(),
    weekday_cycle: z.string(),
  }),
  source: z.string(),
  edition: z.object({ code: z.string(), label: z.string() }).nullable(),
  notice: z.string(),
  readings_available: z.boolean(),
  readings: z.array(readingSchema),
  audio_url: z.string().nullable(),
  // Extrait, auteur et date viennent avec le jour liturgique : plus de second appel à /news/{id}/.
  meditation: z
    .object({
      id: z.string(),
      title: z.string(),
      scope: z.string().nullable(),
      excerpt: z.string().nullable(),
      author_name: z.string(),
      published_at: z.string().nullable(),
    })
    .nullable(),
});
export type LiturgyDay = z.infer<typeof liturgyDaySchema>;

/** `date` (AAAA-MM-JJ) absente : le jour courant du serveur (`/liturgy/today/`). */
export const getLiturgyDay = async (date?: string, signal?: AbortSignal): Promise<LiturgyDay> =>
  liturgyDaySchema.parse(await api.get(date ? `/liturgy/${date}/` : '/liturgy/today/', { signal }));

export const liturgyDayQueryOptions = (date?: string) =>
  queryOptions({
    // Clé distincte de celle du bandeau (['liturgy', 'today']) : son schéma est plus étroit.
    queryKey: ['parole', 'jour', date ?? 'today'],
    queryFn: ({ signal }) => getLiturgyDay(date, signal),
    staleTime: 30 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

export const useLiturgyDay = (date?: string) => useQuery(liturgyDayQueryOptions(date));
