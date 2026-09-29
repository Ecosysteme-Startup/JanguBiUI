import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { POUR_VOUS_KEY } from '@/lib/personnalisation/parole';

// « Pour vous aujourd'hui » — backend `docs/API-PAROLE-POUR-VOUS.md` §5.
// Précalculé chaque nuit ; jamais de score, seulement des raisons courtes, à
// afficher telles quelles. Sans précalcul : verset des lectures du jour.

const livreSchema = z.object({
  id: z.number(),
  nom: z.string(),
  slug: z.string(),
});

const versetSchema = z.object({
  id: z.number(),
  reference: z.string(),
  livre: livreSchema,
  chapitre: z.number(),
  numero: z.number(),
  texte: z.string(),
  raisons: z.array(z.string()),
});
export type VersetPourVous = z.infer<typeof versetSchema>;

export const pourVousSchema = z.object({
  date: z.string(),
  /** `true` : calcul de la nuit ; `false` : verset des lectures du jour. */
  personnalise: z.boolean(),
  personnalisation_parole: z.boolean(),
  verset: versetSchema.nullable(),
  autres_versets: z.array(versetSchema),
  lecture_a_continuer: z
    .object({
      reference: z.string(),
      livre: livreSchema,
      chapitre: z.number(),
      reprendre_au_verset: z.number().nullable(),
    })
    .nullable(),
  livre_suggere: z
    .object({
      id: z.number(),
      nom: z.string(),
      slug: z.string(),
      raison: z.string(),
    })
    .nullable(),
  plan_suggere: z
    .object({
      id: z.number(),
      titre: z.string(),
      description: z.string(),
      raison: z.string(),
    })
    .nullable(),
  raisons: z.array(z.string()),
});
export type PourVous = z.infer<typeof pourVousSchema>;

export const getPourVous = (): Promise<PourVous> =>
  api.get<unknown>('/bible/pour-vous/').then((d) => pourVousSchema.parse(d));

export const usePourVous = () =>
  useQuery(
    queryOptions({
      queryKey: POUR_VOUS_KEY,
      queryFn: getPourVous,
      // Ligne précalculée pour la journée : inutile de la relire souvent.
      staleTime: 30 * 60_000,
      retry: false,
    }),
  );
