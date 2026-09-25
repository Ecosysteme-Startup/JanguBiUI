import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { type InternalNote, noteSchema } from '../types/processing';

/** Notes internes de l'équipe : jamais exposées au fidèle (EF-ACT-02). */
export const getNotes = async (id: string): Promise<InternalNote[]> =>
  z.array(noteSchema).parse(await api.get(`/staff/documents/${encodeURIComponent(id)}/notes/`));

export const notesQueryOptions = (nodeId: string, id: string) =>
  queryOptions({ queryKey: ['demandes', nodeId, 'notes', id], queryFn: () => getNotes(id) });

export const useNotes = (nodeId: string, id: string) => useQuery(notesQueryOptions(nodeId, id));
