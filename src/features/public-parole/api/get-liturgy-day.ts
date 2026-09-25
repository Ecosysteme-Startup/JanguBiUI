import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const verseSchema = z.object({ book: z.string(), chapter: z.number(), number: z.number(), text: z.string() });

const readingSchema = z.object({
  type: z.string(),
  citation: z.string(),
  // Texte AELF (HTML) servi seulement en source « aelf » ; sinon versets de la Bible locale.
  text: z.string().nullable().optional(),
  verses: z.array(verseSchema).default([]),
});
export type Reading = z.infer<typeof readingSchema>;

export const liturgyDaySchema = z.object({
  date: z.string(),
  calendar: z.object({
    date: z.string().optional(),
    season: z.string().optional(),
    season_label: z.string(),
    week: z.number().nullable(),
    celebration: z.string(),
    rank: z.string().optional(),
    color: z.string(),
    sunday_cycle: z.string().optional(),
    weekday_cycle: z.string().optional(),
  }),
  source: z.string().optional(),
  edition: z.object({ code: z.string(), label: z.string() }).nullable().optional(),
  notice: z.string().default(''),
  readings_available: z.boolean().default(true),
  readings: z.array(readingSchema).default([]),
});
export type LiturgyDayFull = z.infer<typeof liturgyDaySchema>;

/** Jour liturgique public : `/liturgy/today/` sans date, `/liturgy/{date}/` sinon (EF-PAR-01, -02). */
export const getLiturgyDay = async (date?: string): Promise<LiturgyDayFull> =>
  liturgyDaySchema.parse(await api.get(date ? `/liturgy/${encodeURIComponent(date)}/` : '/liturgy/today/'));

export const liturgyDayQueryOptions = (date?: string) =>
  queryOptions({
    queryKey: ['liturgy', 'day', date ?? 'today'],
    queryFn: () => getLiturgyDay(date),
    staleTime: 30 * 60 * 1000,
  });

export const useLiturgyDay = (date?: string, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...liturgyDayQueryOptions(date), enabled, placeholderData: keepPreviousData });
