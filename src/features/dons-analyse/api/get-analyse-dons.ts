import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Contrat : GET /v1/staff/dons/analyse/ — voir ../README.md.
// Une seule route, deux portées : `paroisse` (détail, montants exacts) et
// `diocese` (agrégats arrondis au millier, ordre alphabétique, sans masquage).

export const TYPES_FONDS = [
  'quete_dominicale',
  'quete_imperee',
  'campagne',
  'contribution_annuelle',
  'autres',
] as const;

export const typeFondsSchema = z.enum(TYPES_FONDS);
export type TypeFonds = z.infer<typeof typeFondsSchema>;

export const GRANULARITES = ['semaine', 'mois', 'trimestre', 'annee'] as const;
export type Granularite = (typeof GRANULARITES)[number];

const periodeSchema = z.object({
  granularite: z.enum(GRANULARITES),
  debut: z.string(),
  fin: z.string(),
  libelle: z.string(),
  en_cours: z.boolean(),
});

const repartitionFondsSchema = z.object({
  type: typeFondsSchema,
  libelle: z.string(),
  montant: z.number(),
});

const valeursParFondsSchema = z.record(typeFondsSchema, z.number());

// ---------------------------------------------------------------- paroisse

const ligneRepartitionSchema = z.object({
  code: z.string(),
  libelle: z.string(),
  montant: z.number(),
  nombre: z.number().nullable(),
  /** 0 = ligne principale, 1 = sous-ligne (retrait de 16 px). */
  niveau: z.number().int().min(0).max(1).default(0),
  /** Libellé du compteur (« dons », « quêtes »). */
  unite: z.string().nullable().default(null),
  /** Ligne « lieu non renseigné » : barre grise, libellé atténué. */
  non_renseigne: z.boolean().default(false),
});
export type LigneRepartition = z.infer<typeof ligneRepartitionSchema>;

export const TYPES_A_TRAITER = [
  'quete_a_confirmer',
  'paiements_en_attente',
  'depot_especes',
  'remise_curie',
] as const;

const aTraiterSchema = z.object({
  id: z.string(),
  type: z.enum(TYPES_A_TRAITER),
  titre: z.string(),
  /** Date limite ISO : la liste se trie dessus, la plus proche en premier. */
  echeance: z.string(),
  detail: z.string().nullable(),
});
export type ElementATraiter = z.infer<typeof aTraiterSchema>;

const campagneSchema = z.object({
  id: z.string(),
  titre: z.string(),
  debut: z.string(),
  fin: z.string(),
  objectif: z.number().nullable(),
  reuni: z.number(),
  nombre_dons: z.number(),
  montant_periode: z.number(),
  rythme_hebdo: z.number().nullable(),
  projection_fin: z.number().nullable(),
  /** Cumul en fin de mois, du premier mois au mois courant (partiel). */
  cumul: z.array(z.object({ mois: z.string(), cumul: z.number() })),
});
export type Campagne = z.infer<typeof campagneSchema>;

export const analyseParoisseSchema = z.object({
  portee: z.literal('paroisse'),
  lieu: z.object({ id: z.string(), nom: z.string(), diocese: z.string() }),
  periode: periodeSchema,
  arrete_au: z.string(),
  collecte: z.object({
    total: z.number(),
    en_ligne: z.number(),
    en_ligne_nombre: z.number(),
    especes: z.number(),
    especes_quetes: z.number(),
    pour_paroisse: z.number(),
    pour_curie: z.number(),
    quete_imperee_libelle: z.string().nullable(),
    a_confirmer: z
      .object({ montant: z.number(), nombre: z.number() })
      .nullable(),
  }),
  par_fonds: z.array(repartitionFondsSchema),
  par_semaine: z.array(
    z.object({
      debut: z.string(),
      fin: z.string(),
      libelle: z.string(),
      sous_libelle: z.string(),
      valeurs: valeursParFondsSchema,
      total: z.number(),
    }),
  ),
  par_canal: z.array(ligneRepartitionSchema),
  par_moyen: z.array(ligneRepartitionSchema),
  par_lieu: z.array(ligneRepartitionSchema),
  paiements: z.object({
    lances: z.number(),
    confirmes: z.number(),
    en_attente: z.number(),
    echoues: z.number(),
    expires: z.number(),
    plus_ancien_attente_depuis: z.string().nullable(),
    delai_median_s: z.number().nullable(),
  }),
  tresorerie: z.object({
    paye_en_ligne: z.number(),
    frais: z.number(),
    net_en_ligne: z.number(),
    reverse: z.number(),
    reverse_le: z.string().nullable(),
    en_attente_reversement: z.number(),
    dons_frais_couverts: z.number(),
    net_pour_100: z.number(),
    especes_validees: z.number(),
    especes_deposees: z.number(),
    especes_en_caisse: z.number(),
    quete_a_confirmer: z.number(),
  }),
  campagnes: z.array(campagneSchema),
  a_traiter: z.array(aTraiterSchema),
  notes: z.object({
    par_semaine: z.array(z.string()),
  }),
});
export type AnalyseParoisse = z.infer<typeof analyseParoisseSchema>;

// ---------------------------------------------------------------- diocèse

const ligneParoisseSchema = z.object({
  id: z.string(),
  nom: z.string(),
  doyenne: z.string(),
  note: z.string().nullable(),
  statut: z.enum(['collecte_ouverte', 'en_preparation']),
  collecte: z.number().nullable(),
  part_en_ligne: z.number().nullable(),
  quetes_a_valider: z.number().nullable(),
  /** Évolution par rapport à la paroisse elle-même, en texte neutre. */
  evolution: z.enum(['stable', 'hausse', 'baisse']).nullable(),
  evolution_libelle: z.string().nullable(),
});
export type LigneParoisse = z.infer<typeof ligneParoisseSchema>;

const ligneQueteImpereeSchema = z.object({
  paroisse_id: z.string(),
  nom: z.string(),
  ouverte: z.boolean(),
  en_ligne: z.number().nullable(),
  especes: z.number().nullable(),
  total: z.number().nullable(),
  remis: z.number().nullable(),
  reste: z.number().nullable(),
  echeance: z.string().nullable(),
});
export type LigneQueteImperee = z.infer<typeof ligneQueteImpereeSchema>;

export const analyseDioceseSchema = z.object({
  portee: z.literal('diocese'),
  diocese: z.object({ id: z.string(), nom: z.string(), province: z.string() }),
  periode: periodeSchema,
  arrete_au: z.string(),
  collecte: z.object({
    /** Arrondi au millier côté serveur. */
    total: z.number(),
    pour_curie: z.number(),
    paroisses_engagees: z.number(),
    paroisses_actives: z.number(),
    paroisses_en_preparation: z.number(),
  }),
  par_fonds: z.array(repartitionFondsSchema),
  par_mois: z.array(
    z.object({
      mois: z.string(),
      valeurs: valeursParFondsSchema,
      total: z.number(),
    }),
  ),
  premier_mois: z.string().nullable(),
  paroisses: z.array(ligneParoisseSchema),
  quete_imperee: z
    .object({
      libelle: z.string(),
      sous_titre: z.string(),
      lignes: z.array(ligneQueteImpereeSchema),
    })
    .nullable(),
  compte_marchand: z.object({
    recu: z.number(),
    frais: z.number(),
    confirme_non_reverse: z.number(),
    ecarts_ouverts: z.number(),
    delai_moyen_jours: z.number().nullable(),
    dernier_reversement_le: z.string().nullable(),
  }),
  compte_liaison: z.array(
    z.object({
      libelle: z.string(),
      montant: z.number(),
      detail: z.string(),
    }),
  ),
});
export type AnalyseDiocese = z.infer<typeof analyseDioceseSchema>;

// ---------------------------------------------------------------- requête

export type FiltresAnalyse = {
  granularite: Granularite;
  /** Période de référence, `AAAA-MM` (mois) ou `AAAA-MM-JJ` (semaine). */
  date?: string;
  fonds?: TypeFonds;
  canal?: string;
  lieu?: string;
  doyenne?: string;
  /** Nœud (paroisse ou diocèse) ; facultatif si le compte n'en a qu'un. */
  node?: string;
};

const toQuery = (params: Record<string, string | undefined>) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
};

export const getAnalyseParoisse = (
  filtres: FiltresAnalyse,
): Promise<AnalyseParoisse> =>
  api
    .get<unknown>(
      `/v1/staff/dons/analyse/${toQuery({ portee: 'paroisse', ...filtres })}`,
    )
    .then((data) => analyseParoisseSchema.parse(data));

export const getAnalyseDiocese = (
  filtres: FiltresAnalyse,
): Promise<AnalyseDiocese> =>
  api
    .get<unknown>(
      `/v1/staff/dons/analyse/${toQuery({ portee: 'diocese', ...filtres })}`,
    )
    .then((data) => analyseDioceseSchema.parse(data));

export const useAnalyseParoisse = (filtres: FiltresAnalyse) =>
  useQuery(
    queryOptions({
      queryKey: ['dons-analyse', 'paroisse', filtres],
      queryFn: () => getAnalyseParoisse(filtres),
      retry: false,
      // Pas de squelette qui clignote à chaque filtre (03 §4.3).
      placeholderData: (prev) => prev,
    }),
  );

export const useAnalyseDiocese = (filtres: FiltresAnalyse) =>
  useQuery(
    queryOptions({
      queryKey: ['dons-analyse', 'diocese', filtres],
      queryFn: () => getAnalyseDiocese(filtres),
      retry: false,
      placeholderData: (prev) => prev,
    }),
  );
