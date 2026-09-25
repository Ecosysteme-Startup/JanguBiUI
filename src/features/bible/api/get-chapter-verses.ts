import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const verseSchema = z.object({ id: z.number(), number: z.number(), text: z.string() });
export type Verse = z.infer<typeof verseSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(verseSchema) });

// La pagination du backend plafonne à 50 (`LimitOffsetPagination.max_limit`) : un long chapitre
// (Ps 118 : 176 versets) demande plusieurs pages, chargées en parallèle après la première.
const PAGE = 50;

export const getChapterVerses = async (bookId: number, chapter: number, signal?: AbortSignal): Promise<Verse[]> => {
  const url = `/bible/books/${bookId}/chapters/${chapter}/verses/`;
  const first = pageSchema.parse(await api.get(url, { params: { limit: PAGE, offset: 0 }, signal }));
  const offsets = [];
  for (let offset = PAGE; offset < first.count; offset += PAGE) offsets.push(offset);
  const rest = await Promise.all(
    offsets.map(async (offset) => pageSchema.parse(await api.get(url, { params: { limit: PAGE, offset }, signal })).results),
  );
  return [...first.results, ...rest.flat()];
};

export const chapterVersesQueryOptions = (bookId: number | undefined, chapter: number) =>
  queryOptions({
    queryKey: ['bible', 'verses', bookId, chapter],
    queryFn: ({ signal }) => getChapterVerses(bookId as number, chapter, signal),
    enabled: bookId !== undefined,
    staleTime: Infinity,
  });

export const useChapterVerses = (bookId: number | undefined, chapter: number) => useQuery(chapterVersesQueryOptions(bookId, chapter));
