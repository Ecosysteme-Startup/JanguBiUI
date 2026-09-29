import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

import { type Periode, periodeSchema } from './get-analyse-dons';

// Contrat : GET /v1/platform/dons/activite/ — backend `docs/API-DONS-ANALYSE.md`
// §3 (source : `ActiviteSerializer`). Décision du 27/09 : la plateforme ne voit
// AUCUN montant, même agrégé. Les schémas sont stricts : un champ inattendu (un
// montant ajouté par erreur côté serveur) fait échouer l'analyse plutôt que
// d'être affiché en silence.

const statuts = {
  lances: z.number(),
  confirmes: z.number(),
  en_attente: z.number(),
  echoues: z.number(),
  expires: z.number(),
};

export const activitePlateformeSchema = z
  .object({
    periode: periodeSchema.strict(),
    genere_le: z.string(),
    paiements: z
      .object({
        ...statuts,
        rembourses: z.number(),
        taux_confirmation: z.number().nullable(),
        taux_echec: z.number().nullable(),
        /** Toutes périodes confondues. */
        plus_ancien_en_attente: z.string().nullable(),
      })
      .strict(),
    delais: z
      .object({
        confirmation_mediane_s: z.number().nullable(),
        confirmation_p95_s: z.number().nullable(),
        reversement_moyen_jours: z.number().nullable(),
        reversement_median_jours: z.number().nullable(),
        echantillon_confirmation: z.number(),
      })
      .strict(),
    par_jour: z.array(z.object({ date: z.string(), ...statuts }).strict()),
    par_moyen: z.array(
      z
        .object({
          moyen: z.string(),
          libelle: z.string(),
          confirmes: z.number(),
          echecs: z.number(),
          taux_echec: z.number().nullable(),
        })
        .strict(),
    ),
    par_source: z.array(
      z
        .object({
          source: z.string(),
          libelle: z.string(),
          lances: z.number(),
          confirmes: z.number(),
          taux_confirmation: z.number().nullable(),
          retours: z.number(),
          taux_retour: z.number().nullable(),
        })
        .strict(),
    ),
    par_paroisse: z.array(
      z
        .object({
          id: z.string(),
          nom: z.string(),
          collecte_ouverte: z.boolean(),
          ...statuts,
          taux_confirmation: z.number().nullable(),
          derniere_confirmation: z.string().nullable(),
          quetes_saisies: z.number(),
        })
        .strict(),
    ),
    notifications: z
      .object({
        recues: z.number(),
        traitees: z.number(),
        doublons: z.number(),
        rejetees: z.number(),
        erreurs: z.number(),
        en_cours: z.number(),
        derniere_recue: z.string().nullable(),
      })
      .strict(),
    charge: z.array(
      z
        .object({
          /** 1 = lundi … 7 = dimanche. */
          jour_semaine: z.number().int().min(1).max(7),
          /** 0 à 23, heure de Dakar. */
          heure: z.number().int().min(0).max(23),
          nombre: z.number(),
        })
        .strict(),
    ),
    incidents: z
      .object({
        ouverts: z.number(),
        par_type: z.record(z.string(), z.number()),
        liste: z.array(
          z
            .object({
              type: z.string(),
              reference: z.string(),
              paroisse: z.string().nullable(),
              detecte_le: z.string(),
              statut: z.string(),
            })
            .strict(),
        ),
      })
      .strict(),
    reversements: z
      .object({ a_rapprocher: z.number(), en_ecart: z.number() })
      .strict(),
  })
  .strict();

export type ActivitePlateforme = z.infer<typeof activitePlateformeSchema>;
export type IncidentPaiement = ActivitePlateforme['incidents']['liste'][number];

export type ParametresPlateforme = {
  periode: Periode;
  date?: string;
};

export const getActivitePlateforme = (
  params: ParametresPlateforme,
): Promise<ActivitePlateforme> => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  return api
    .get<unknown>(`/v1/platform/dons/activite/?${qs.toString()}`)
    .then((data) => activitePlateformeSchema.parse(data));
};

export const useActivitePlateforme = (params: ParametresPlateforme) =>
  useQuery(
    queryOptions({
      queryKey: ['dons-analyse', 'plateforme', params],
      queryFn: () => getActivitePlateforme(params),
      retry: false,
      placeholderData: (prev) => prev,
    }),
  );
