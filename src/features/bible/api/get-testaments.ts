import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// `TestamentWithBooksOutputSerializer` : `books` est déclaré en dictionnaires libres dans le schéma,
// la forme réelle est `BookMetadataOutputSerializer` (+ chapter_count annoté).
export const bookSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  order: z.number(),
  testament: z.string(),
  verse_count: z.number(),
  chapter_count: z.number(),
});
export type Book = z.infer<typeof bookSchema>;

const testamentSchema = z.object({ slug: z.string(), name: z.string(), order: z.number(), books: z.array(bookSchema) });
export type Testament = z.infer<typeof testamentSchema>;

/** Toute la table des livres en un appel (mise en cache 24 h côté serveur). */
export const getTestaments = async (signal?: AbortSignal): Promise<Testament[]> =>
  z.array(testamentSchema).parse(await api.get('/bible/testaments/', { signal }));

export const testamentsQueryOptions = () =>
  queryOptions({ queryKey: ['bible', 'testaments'], queryFn: ({ signal }) => getTestaments(signal), staleTime: Infinity });

export const useTestaments = () => useQuery(testamentsQueryOptions());
