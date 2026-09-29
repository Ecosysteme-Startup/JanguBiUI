import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// POST /v1/bible/signets/ (API-PAROLE-POUR-VOUS §3) : sans couleur, un
// signet ; un signet compte déjà comme signal, pas d'événement en plus.

export const COULEURS_SIGNET = [
  '',
  'jaune',
  'vert',
  'bleu',
  'rose',
  'violet',
] as const;
export type CouleurSignet = (typeof COULEURS_SIGNET)[number];

const signetSchema = z.object({
  id: z.number(),
  verset_id: z.number(),
  reference: z.string(),
  livre_id: z.number(),
  chapitre: z.number(),
  numero: z.number(),
  texte: z.string(),
  type: z.string(),
  couleur: z.string(),
  note: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Signet = z.infer<typeof signetSchema>;

export type CreerSignetInput = {
  verset_id: number;
  couleur?: CouleurSignet;
  note?: string;
};

export const creerSignet = (input: CreerSignetInput): Promise<Signet> =>
  api
    .post<unknown>('/v1/bible/signets/', { couleur: '', ...input })
    .then((d) => signetSchema.parse(d));

export const useCreerSignet = () => useMutation({ mutationFn: creerSignet });
