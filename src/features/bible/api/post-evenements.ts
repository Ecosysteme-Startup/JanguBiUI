import { z } from 'zod';

import { api } from '@/lib/api-client';

// POST /v1/bible/evenements/ (API-PAROLE-POUR-VOUS §1) : signaux de lecture,
// par lots de 200 au plus, idempotents (`client_event_id`).

export const TAILLE_LOT_MAX = 200;

export type EvenementLecture = {
  client_event_id: string;
  type: 'lu' | 'signet' | 'surligne' | 'recherche' | 'lectio';
  occurred_at: string;
  verset_debut_id?: number;
  verset_fin_id?: number;
  livre_id?: number;
  chapitre?: number;
  termine?: boolean;
};

const reponseSchema = z.object({
  recus: z.number(),
  enregistres: z.number(),
  rejetes: z.array(z.string()),
  personnalisation_parole: z.boolean(),
});
export type ReponseEvenements = z.infer<typeof reponseSchema>;

export const envoyerEvenements = (
  evenements: EvenementLecture[],
): Promise<ReponseEvenements> =>
  api
    .post<unknown>('/v1/bible/evenements/', { evenements })
    .then((d) => reponseSchema.parse(d));
