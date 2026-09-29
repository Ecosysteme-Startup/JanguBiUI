import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Jour liturgique V1 (backend apps/liturgy/selectors.py → liturgy_day) :
//   GET /v1/liturgy/today/        et  GET /v1/liturgy/<AAAA-MM-JJ>/
// Le calendrier est calculé localement ; les lectures dépendent de la source :
//   - `crampon_refs` : références du jour, texte = versets de la Bible locale
//     (`verses`), `text` vaut null ;
//   - `aelf` : texte AELF (`text`, HTML), `verses` vide.
// La mention `notice` (droits des textes) doit être affichée avec les lectures.

export const liturgyVerseSchema = z.object({
  book: z.string(),
  chapter: z.number(),
  number: z.number(),
  text: z.string(),
});

export const liturgyReadingSchema = z.object({
  type: z.string(),
  citation: z.string().default(''),
  text: z.string().nullable().default(null),
  verses: z.array(liturgyVerseSchema).default([]),
});

export const liturgyCalendarSchema = z.object({
  date: z.string(),
  liturgical_year: z.number(),
  season: z.string(),
  season_label: z.string(),
  week: z.number().nullable(),
  celebration: z.string(),
  rank: z.string(),
  color: z.string(),
  sunday_cycle: z.string(),
  weekday_cycle: z.string(),
});

export const liturgyMeditationSchema = z.object({
  id: z.string(),
  title: z.string(),
  scope: z.string().nullable(),
  excerpt: z.string().nullable(),
  author_name: z.string(),
  published_at: z.string().nullable(),
});

export const liturgyDaySchema = z.object({
  date: z.string(),
  calendar: liturgyCalendarSchema,
  source: z.string(),
  edition: z.unknown().nullable().default(null),
  notice: z.string().default(''),
  readings_available: z.boolean(),
  readings: z.array(liturgyReadingSchema),
  audio_url: z.string().nullable().default(null),
  meditation: liturgyMeditationSchema.nullable().default(null),
});

export type LiturgyVerse = z.infer<typeof liturgyVerseSchema>;
export type LiturgyReading = z.infer<typeof liturgyReadingSchema>;
export type LiturgyCalendar = z.infer<typeof liturgyCalendarSchema>;
export type LiturgyDay = z.infer<typeof liturgyDaySchema>;

/** Date locale au format AAAA-MM-JJ (pas de décalage UTC). */
export const toIsoDay = (date: Date): string => {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
};

export async function fetchLiturgyToday(): Promise<LiturgyDay> {
  const data = await api.get<unknown>('/v1/liturgy/today/');
  return liturgyDaySchema.parse(data);
}

export async function fetchLiturgyForDate(
  dateStr: string,
): Promise<LiturgyDay> {
  const data = await api.get<unknown>(`/v1/liturgy/${dateStr}/`);
  return liturgyDaySchema.parse(data);
}

export const getLiturgyQueryOptions = (date?: Date) => {
  const today = new Date();
  const isToday = !date || date.toDateString() === today.toDateString();

  if (isToday) {
    return queryOptions({
      queryKey: ['liturgy', 'today'],
      queryFn: fetchLiturgyToday,
    });
  }

  const dateStr = toIsoDay(date);
  return queryOptions({
    queryKey: ['liturgy', 'date', dateStr],
    queryFn: () => fetchLiturgyForDate(dateStr),
  });
};

export function useLiturgyToday(date?: Date) {
  return useQuery(getLiturgyQueryOptions(date));
}
