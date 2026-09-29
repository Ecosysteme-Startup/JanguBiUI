import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Sous-module « bible.avance » gelé en V1 (indicateur `notes-homelie`).
// GET|POST /v1/bible/homilenotes/ — liste paginée des notes de l'auteur,
// sans filtre serveur : le passage est filtré côté client.
export const homilyNoteSchema = z.object({
  id: z.number(),
  passage_start_id: z.number(),
  passage_end_id: z.number().nullable().default(null),
  content: z.string(),
  created_at: z.string().optional(),
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
    .get<unknown>('/v1/bible/homilenotes/', { params: { limit: 50 } })
    .then(parseNotes)
    .then(({ results }) => {
      const notes = results.filter((n) => n.passage_start_id === passageId);
      return { count: notes.length, results: notes };
    });

export const getHomilyNotesQueryOptions = (passageId: number) =>
  queryOptions({
    queryKey: ['homily-notes', passageId],
    queryFn: () => getHomilyNotes(passageId),
    enabled: passageId > 0,
  });

export const useHomilyNotes = (passageId: number) =>
  useQuery(getHomilyNotesQueryOptions(passageId));
