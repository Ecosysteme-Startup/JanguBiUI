import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Doublon assumé de la feature `parole` : la Bible s'ouvre sur l'Évangile du jour.
const verseSchema = z.object({ book: z.string(), chapter: z.number(), number: z.number() });
const readingSchema = z.object({ type: z.string(), citation: z.string(), verses: z.array(verseSchema) });
const daySchema = z.object({ date: z.string(), readings: z.array(readingSchema) });

export type GospelPassage = { book: string; chapter: number; from: number; to: number; citation: string };

/** Livre, chapitre et versets de l'Évangile du jour (premier chapitre s'il en couvre plusieurs), sinon null. */
export const getGospelOfDay = async (signal?: AbortSignal): Promise<GospelPassage | null> => {
  const day = daySchema.parse(await api.get('/liturgy/today/', { signal }));
  const gospel = day.readings.find((r) => r.type.toLowerCase() === 'evangile');
  const first = gospel?.verses[0];
  if (!gospel || !first) return null;
  const numbers = gospel.verses.filter((v) => v.chapter === first.chapter).map((v) => v.number);
  return { book: first.book, chapter: first.chapter, from: Math.min(...numbers), to: Math.max(...numbers), citation: gospel.citation };
};

export const gospelOfDayQueryOptions = () =>
  queryOptions({ queryKey: ['bible', 'evangile-du-jour'], queryFn: ({ signal }) => getGospelOfDay(signal), staleTime: 30 * 60 * 1000 });

export const useGospelOfDay = () => useQuery(gospelOfDayQueryOptions());
