import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const homilyNoteSchema = z.object({
  id: z.number(),
  passage_id: z.number(),
  content: z.string(),
  updated_at: z.string(),
});

export type HomilyNote = z.infer<typeof homilyNoteSchema>;

type NotesResponse = { count: number; results: HomilyNote[] };

const parseNotes = (data: unknown): NotesResponse => {
  const raw = data as { count: number; results: unknown[] };
  return {
    count: raw.count,
    results: raw.results.map((item) => homilyNoteSchema.parse(item)),
  };
};

export const getHomilyNotes = (passageId: number): Promise<NotesResponse> =>
  api
    .get<unknown>(`/v1/bible/homily-notes/?passage_id=${passageId}`)
    .then(parseNotes);

export const getHomilyNotesQueryOptions = (passageId: number) =>
  queryOptions({
    queryKey: ['homily-notes', passageId],
    queryFn: () => getHomilyNotes(passageId),
    enabled: passageId > 0,
  });

export const useHomilyNotes = (passageId: number) =>
  useQuery(getHomilyNotesQueryOptions(passageId));
