import { api } from '@/lib/api-client';

import { lectureSchema, type Lecture } from '../types/schemas';

import { AUDIO } from './keys';

// POST /audio/pistes/<id>/lecture/ — droit d'écoute, URL signée, reprise,
// forme d'onde. Utilisé par l'adaptateur de lecture de secours (play.ts).
export const getLecture = async (trackId: string): Promise<Lecture> =>
  lectureSchema.parse(
    await api.post<unknown>(`${AUDIO}/pistes/${trackId}/lecture/`),
  );
