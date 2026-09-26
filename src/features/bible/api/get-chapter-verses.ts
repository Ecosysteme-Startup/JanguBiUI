import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const verseSchema = z.object({ id: z.number(), number: z.number(), text: z.string() });
export type Verse = z.infer<typeof verseSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(verseSchema) });

// Une page couvre un chapitre entier (le plus long, Ps 119, a 176 versets) : 200 au plus.
const CHAPTER_LIMIT = 200;

export const getChapterVerses = async (bookId: number, chapter: number, signal?: AbortSignal): Promise<Verse[]> =>
  pageSchema.parse(
    await api.get(`/bible/books/${bookId}/chapters/${chapter}/verses/`, { params: { limit: CHAPTER_LIMIT }, signal }),
  ).results;

export const chapterVersesQueryOptions = (bookId: number | undefined, chapter: number) =>
  queryOptions({
    queryKey: ['bible', 'verses', bookId, chapter],
    queryFn: ({ signal }) => getChapterVerses(bookId as number, chapter, signal),
    enabled: bookId !== undefined,
    staleTime: Infinity,
  });

export const useChapterVerses = (bookId: number | undefined, chapter: number) => useQuery(chapterVersesQueryOptions(bookId, chapter));
