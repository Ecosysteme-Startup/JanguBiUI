import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Contrat : GET /v1/platform/dons/activite/ — voir ../README.md.
// Décision du 27/09 : la plateforme ne voit AUCUN montant, même agrégé.
// Les schémas sont stricts : un champ inattendu (un montant ajouté par erreur
// côté serveur) fait échouer l'analyse plutôt que d'être affiché en silence.

const statutsSchema = z
  .object({
    lances: z.number(),
    confirmes: z.number(),
    en_attente: z.number(),
    echoues: z.number(),
    expires: z.number(),
  })
  .strict();

export const activitePlateformeSchema = z
  .object({
    periode: z
      .object({
        granularite: z.enum(['semaine', 'mois']),
        debut: z.string(),
        fin: z.string(),
        libelle: z.string(),
      })
      .strict(),
    arrete_au: z.string(),
    paiements: statutsSchema
      .extend({
        plus_ancien_attente_depuis: z.string().nullable(),
        derniere_notification_le: z.string().nullable(),
      })
      .strict(),
    par_jour: z.array(
      statutsSchema.extend({ date: z.string(), partiel: z.boolean() }).strict(),
    ),
    delai: z
      .object({
        median_s: z.number().nullable(),
        p95_s: z.number().nullable(),
        par_jour: z.array(
          z
            .object({
              date: z.string(),
              median_s: z.number().nullable(),
              p95_s: z.number().nullable(),
            })
            .strict(),
        ),
        note: z.string().nullable(),
      })
      .strict(),
    notifications: z
      .object({
        par_jour: z.array(
          z.object({ date: z.string(), recues: z.number() }).strict(),
        ),
        recues: z.number(),
        traitees: z.number(),
        doublons: z.number(),
        rejetees: z.number(),
        erreurs: z.number(),
      })
      .strict(),
    charge: z
      .object({
        jours: z.array(
          z
            .object({
              date: z.string(),
              /** 24 valeurs au plus ; moins pour un jour en cours. */
              heures: z.array(z.number()),
            })
            .strict(),
        ),
        total: z.number(),
        note: z.string().nullable(),
      })
      .strict(),
    sources: z.array(
      z
        .object({ code: z.string(), libelle: z.string(), nombre: z.number() })
        .strict(),
    ),
    retours_ios: z
      .object({ revenus: z.number(), total: z.number() })
      .strict()
      .nullable(),
    paroisses: z
      .object({
        parametrees: z.number(),
        activees: z.array(
          z
            .object({
              id: z.string(),
              nom: z.string(),
              derniere_confirmation_le: z.string().nullable(),
            })
            .strict(),
        ),
      })
      .strict(),
    incidents: z.array(
      z
        .object({
          id: z.string(),
          date: z.string(),
          reference: z.string().nullable(),
          contexte: z.string(),
          nature: z.string(),
          etat: z.enum(['en_attente', 'doublon', 'a_examiner', 'resolu']),
          action: z.enum(['relancer', 'acces_urgence']).nullable(),
        })
        .strict(),
    ),
  })
  .strict();

export type ActivitePlateforme = z.infer<typeof activitePlateformeSchema>;
export type IncidentPaiement = ActivitePlateforme['incidents'][number];

export type FiltresPlateforme = {
  granularite: 'semaine' | 'mois';
  date?: string;
  paroisse?: string;
  moyen?: string;
  source?: string;
};

export const getActivitePlateforme = (
  filtres: FiltresPlateforme,
): Promise<ActivitePlateforme> => {
  const qs = new URLSearchParams();
  Object.entries(filtres).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  return api
    .get<unknown>(`/v1/platform/dons/activite/?${qs.toString()}`)
    .then((data) => activitePlateformeSchema.parse(data));
};

export const useActivitePlateforme = (filtres: FiltresPlateforme) =>
  useQuery(
    queryOptions({
      queryKey: ['dons-analyse', 'plateforme', filtres],
      queryFn: () => getActivitePlateforme(filtres),
      retry: false,
      placeholderData: (prev) => prev,
    }),
  );
