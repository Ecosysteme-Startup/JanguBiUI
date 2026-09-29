import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Contrat : GET /v1/staff/dons/analyse/ — backend `docs/API-DONS-ANALYSE.md` §2
// (source : `apps/donations/serializers_analyse.py`). Une seule route, deux
// niveaux : `paroisse` (montants exacts, blocs trésorerie / paiements /
// campagnes) et `diocese` (diocèse ou doyenné : agrégats arrondis au millier,
// `paroisses` renseigné, blocs propres à la paroisse à `null`). Les clés sont
// toujours présentes ; un bloc qui ne s'applique pas vaut `null`.

export const TYPES_FONDS = [
  'quete_dominicale',
  'quete_imperee',
  'campagne',
  'contribution_annuelle',
] as const;

export const typeFondsSchema = z.enum(TYPES_FONDS);
export type TypeFonds = z.infer<typeof typeFondsSchema>;

export const NIVEAUX = ['paroisse', 'diocese'] as const;
export type Niveau = (typeof NIVEAUX)[number];

export const PERIODES = ['semaine', 'mois', 'trimestre', 'annee'] as const;
export type Periode = (typeof PERIODES)[number];

export const periodeSchema = z.object({
  type: z.enum(PERIODES),
  /** `2026-W39`, `2026-09`, `2026-T3` ou `2026`. */
  code: z.string(),
  debut: z.string(),
  /** Inclus. */
  fin: z.string(),
  libelle: z.string(),
});
export type PeriodeAnalyse = z.infer<typeof periodeSchema>;

const noeudSchema = z.object({
  id: z.string(),
  nom: z.string(),
  type: z.string(),
});

const confidentialiteSchema = z.object({
  /** 1 (paroisse, exact) ou 1000 (au-dessus de la paroisse). */
  arrondi: z.number(),
  noms_donateurs: z.boolean(),
  ordre_paroisses: z.string(),
  tri_par_montant: z.boolean(),
});

const typeFondsLigneSchema = z.object({
  type: typeFondsSchema,
  libelle: z.string(),
  en_ligne: z.number(),
  especes: z.number(),
  total: z.number(),
  nombre: z.number(),
  part: z.number().nullable(),
});
export type TypeFondsLigne = z.infer<typeof typeFondsLigneSchema>;

const fondsLigneSchema = z.object({
  fonds_id: z.string(),
  titre: z.string(),
  type: typeFondsSchema,
  destination: z.string(),
  en_ligne: z.number(),
  especes: z.number(),
  total: z.number(),
  nombre: z.number(),
  part: z.number().nullable(),
});

const sourceLigneSchema = z.object({
  source: z.string(),
  libelle: z.string(),
  total: z.number(),
  nombre: z.number(),
  part: z.number().nullable(),
});

const canalLigneSchema = z.object({
  canal: z.string(),
  libelle: z.string(),
  total: z.number(),
  nombre: z.number(),
  part: z.number().nullable(),
  sources: z.array(sourceLigneSchema),
});
export type CanalLigne = z.infer<typeof canalLigneSchema>;

const moyenLigneSchema = z.object({
  moyen: z.string(),
  libelle: z.string(),
  total: z.number(),
  nombre: z.number(),
  part: z.number().nullable(),
});
export type MoyenLigne = z.infer<typeof moyenLigneSchema>;

const lieuLigneSchema = z.object({
  /** `null` : « Lieu non renseigné ». */
  lieu_id: z.number().nullable(),
  nom: z.string(),
  en_ligne: z.number(),
  especes: z.number(),
  total: z.number(),
  nombre: z.number(),
  part: z.number().nullable(),
});
export type LieuLigne = z.infer<typeof lieuLigneSchema>;

const montantsParTypeSchema = z.object({
  quete_dominicale: z.number(),
  quete_imperee: z.number(),
  campagne: z.number(),
  contribution_annuelle: z.number(),
});

const syntheseSchema = z.object({
  collecte: z.number(),
  en_ligne: z.number(),
  especes: z.number(),
  nombre_dons_en_ligne: z.number(),
  nombre_quetes: z.number(),
  par_destination: z.object({ paroisse: z.number(), curie: z.number() }),
  par_type_fonds: z.array(typeFondsLigneSchema),
  par_fonds: z.array(fondsLigneSchema).nullable(),
  par_canal: z.array(canalLigneSchema),
  par_moyen: z.array(moyenLigneSchema),
  par_lieu: z.array(lieuLigneSchema).nullable(),
});
export type Synthese = z.infer<typeof syntheseSchema>;

const tendancePointSchema = z.object({
  debut: z.string(),
  fin: z.string(),
  /** « au dim. 6 ». */
  libelle: z.string(),
  total: z.number(),
  en_ligne: z.number(),
  especes: z.number(),
  par_type_fonds: montantsParTypeSchema,
});
export type TendancePoint = z.infer<typeof tendancePointSchema>;

const tendanceSchema = z.object({
  grain: z.enum(['jour', 'semaine', 'mois']),
  points: z.array(tendancePointSchema),
});

export const TYPES_A_TRAITER = [
  'quete_a_confirmer',
  'paiements_en_attente',
  'paiement_tardif',
  'especes_a_deposer',
  'remise_curie',
  'remise_a_confirmer',
  'cloture_mois',
] as const;

const aTraiterSchema = z.object({
  // Évolution additive : un type inconnu reste affiché (badge neutre).
  type: z.string(),
  /** Date `AAAA-MM-JJ` : la liste se trie dessus, la plus proche en premier. */
  echeance: z.string(),
  libelle: z.string(),
  nombre: z.number(),
  montant: z.number().nullable(),
  depuis: z.string().nullable(),
  paroisse: z.object({ id: z.string(), nom: z.string() }).nullable(),
  objet_id: z.string().nullable(),
});
export type ElementATraiter = z.infer<typeof aTraiterSchema>;

const paroisseLigneSchema = z.object({
  id: z.string(),
  nom: z.string(),
  statut_collecte: z.enum(['ouverte', 'en_preparation']),
  collecte: z.number().nullable(),
  part_en_ligne: z.number().nullable(),
  quetes_a_valider: z.number().nullable(),
  /** La paroisse face à elle-même ; `null` sans trois périodes d'historique. */
  evolution: z.enum(['stable', 'en_hausse', 'en_baisse']).nullable(),
});
export type LigneParoisse = z.infer<typeof paroisseLigneSchema>;

const paroissesSchema = z.object({
  compteurs: z.object({
    engagees: z.number(),
    collecte_ouverte: z.number(),
    en_preparation: z.number(),
  }),
  lignes: z.array(paroisseLigneSchema),
});

const impereeParoisseSchema = z.object({
  id: z.string(),
  nom: z.string(),
  en_ligne: z.number(),
  especes: z.number(),
  total: z.number(),
  remis: z.number(),
  remise_declaree: z.number(),
  reste_a_remettre: z.number(),
  part_remise: z.number().nullable(),
});
export type LigneQueteImperee = z.infer<typeof impereeParoisseSchema>;

const queteImpereeSchema = z.object({
  fonds_id: z.string(),
  titre: z.string(),
  date: z.string(),
  echeance: z.string().nullable(),
  messe_anticipee_incluse: z.boolean(),
  paroisses: z.array(impereeParoisseSchema),
});
export type QueteImperee = z.infer<typeof queteImpereeSchema>;

const tresorerieSchema = z.object({
  en_ligne: z.object({
    paye: z.number(),
    frais: z.number(),
    frais_reels: z.number(),
    net: z.number(),
    reverse: z.number(),
    en_attente_reversement: z.number(),
    part_reversee: z.number().nullable(),
    net_pour_100: z.number().nullable(),
    dons_frais_couverts: z.number(),
    nombre: z.number(),
  }),
  especes: z.object({
    validees: z.number(),
    deposees: z.number(),
    en_caisse: z.number(),
    a_confirmer: z.number(),
  }),
});
export type Tresorerie = z.infer<typeof tresorerieSchema>;

const paiementsSchema = z.object({
  lances: z.number(),
  confirmes: z.number(),
  en_attente: z.number(),
  echoues: z.number(),
  expires: z.number(),
  taux_confirmation: z.number().nullable(),
});
export type Paiements = z.infer<typeof paiementsSchema>;

const campagneSchema = z.object({
  fonds_id: z.string(),
  titre: z.string(),
  objectif: z.number().nullable(),
  reuni: z.number(),
  part: z.number().nullable(),
  nombre: z.number(),
  /** Donné sur la période analysée. */
  periode: z.number(),
  debut: z.string().nullable(),
  fin: z.string().nullable(),
  statut: z.string(),
  rythme_hebdo: z.number(),
  projection_fin: z.number().nullable(),
  part_projection: z.number().nullable(),
});
export type Campagne = z.infer<typeof campagneSchema>;

export const analyseDonsSchema = z.object({
  niveau: z.enum(NIVEAUX),
  noeud: noeudSchema,
  periode: periodeSchema,
  genere_le: z.string(),
  confidentialite: confidentialiteSchema,
  synthese: syntheseSchema,
  tendance: tendanceSchema,
  a_traiter: z.array(aTraiterSchema),
  paroisses: paroissesSchema.nullable(),
  quetes_imperees: z.array(queteImpereeSchema),
  tresorerie: tresorerieSchema.nullable(),
  paiements: paiementsSchema.nullable(),
  campagnes: z.array(campagneSchema).nullable(),
  notes: z.array(z.string()),
});
export type AnalyseDons = z.infer<typeof analyseDonsSchema>;

// ---------------------------------------------------------------- requête

export type ParametresAnalyse = {
  niveau: Niveau;
  /** UUID : paroisse (`paroisse`), diocèse ou doyenné (`diocese`). */
  noeud: string;
  periode: Periode;
  /** `2026-W39` · `2026-09` · `2026-T3` · `2026` ; absent : période en cours. */
  date?: string;
};

/** Clé react-query des analyses : `['dons-analyse']` ou `['dons-analyse', niveau]`. */
export const donsAnalyseQueryKey = (niveau?: Niveau) =>
  niveau ? ['dons-analyse', niveau] : ['dons-analyse'];

const toQuery = (params: Record<string, string | undefined>) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  return qs.toString();
};

export const getAnalyseDons = (
  params: ParametresAnalyse,
): Promise<AnalyseDons> =>
  api
    .get<unknown>(`/staff/dons/analyse/?${toQuery(params)}`)
    .then((data) => analyseDonsSchema.parse(data));

export const useAnalyseDons = (
  params: Omit<ParametresAnalyse, 'noeud'> & { noeud: string | undefined },
) =>
  useQuery(
    queryOptions({
      queryKey: [...donsAnalyseQueryKey(params.niveau), params],
      queryFn: () =>
        getAnalyseDons({ ...params, noeud: params.noeud as string }),
      enabled: !!params.noeud,
      retry: false,
      // Pas de squelette qui clignote à chaque filtre (03 §4.3).
      placeholderData: (prev) => prev,
    }),
  );
