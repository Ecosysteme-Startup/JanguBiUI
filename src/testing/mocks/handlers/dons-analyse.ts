import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type { ActivitePlateforme } from '@/features/dons-analyse/api/get-activite-plateforme';
import type {
  AnalyseDons,
  PeriodeAnalyse,
} from '@/features/dons-analyse/api/get-analyse-dons';
import type { Capacite } from '@/features/dons-analyse/api/get-mes-capacites';

// Jeu de référence des tableaux de bord des dons, champ pour champ celui du
// contrat backend `docs/API-DONS-ANALYSE.md` (§2.5 paroisse, §2.6 diocèse, §3.1
// plateforme) : Saint-Dominique, septembre 2026, requête du dimanche
// 27 septembre à 20 h. Les UUID sont ceux, lisibles, du contrat. Fictif.

export const NOEUD_SAINT_DOMINIQUE = '5d000000-0000-4000-8000-00000000000d';
export const NOEUD_ARCHIDIOCESE = 'da000000-0000-4000-8000-00000000000a';

const GENERE_LE = '2026-09-27T20:00:00Z';

const PERIODE_SEPTEMBRE: PeriodeAnalyse = {
  type: 'mois',
  code: '2026-09',
  debut: '2026-09-01',
  fin: '2026-09-30',
  libelle: 'septembre 2026',
};

const CONFIDENTIALITE = {
  noms_donateurs: false,
  ordre_paroisses: 'alphabetique',
  tri_par_montant: false,
};

export const mesCapacitesDemo: Capacite[] = [
  {
    capacite: 'dons.voir_fonds',
    node_id: NOEUD_SAINT_DOMINIQUE,
    node_name: 'Saint-Dominique',
    node_type: 'paroisse',
    herite: false,
    office: 'econome_paroissial',
    office_label: 'Économe',
  },
  {
    capacite: 'dons.voir_agregats',
    node_id: NOEUD_ARCHIDIOCESE,
    node_name: 'Archidiocèse de Dakar',
    node_type: 'diocese',
    herite: false,
    office: 'econome_diocesain',
    office_label: 'Économe diocésain',
  },
];

const QUETE_IMPEREE_SEPTEMBRE = {
  fonds_id: '00000000-0000-4000-8000-000000000005',
  titre: 'Quête impérée · Grand Séminaire de Brin',
  date: '2026-09-27',
  echeance: '2026-10-04',
  messe_anticipee_incluse: true,
  paroisses: [
    {
      id: NOEUD_SAINT_DOMINIQUE,
      nom: 'Saint-Dominique',
      en_ligne: 28525,
      especes: 646000,
      total: 674525,
      remis: 0,
      remise_declaree: 0,
      reste_a_remettre: 646000,
      part_remise: 0,
    },
  ],
};

export const analyseParoisseSeptembre: AnalyseDons = {
  niveau: 'paroisse',
  noeud: {
    id: NOEUD_SAINT_DOMINIQUE,
    nom: 'Saint-Dominique',
    type: 'paroisse',
  },
  periode: PERIODE_SEPTEMBRE,
  genere_le: GENERE_LE,
  confidentialite: { arrondi: 1, ...CONFIDENTIALITE },
  synthese: {
    collecte: 1214830,
    en_ligne: 356330,
    especes: 858500,
    nombre_dons_en_ligne: 47,
    nombre_quetes: 9,
    par_destination: { paroisse: 540305, curie: 674525 },
    par_type_fonds: [
      {
        type: 'quete_dominicale',
        libelle: 'Quête dominicale',
        en_ligne: 47405,
        especes: 212500,
        total: 259905,
        nombre: 9,
        part: 21,
      },
      {
        type: 'quete_imperee',
        libelle: 'Quête impérée',
        en_ligne: 28525,
        especes: 646000,
        total: 674525,
        nombre: 10,
        part: 56,
      },
      {
        type: 'campagne',
        libelle: 'Campagne pour un projet',
        en_ligne: 236400,
        especes: 0,
        total: 236400,
        nombre: 31,
        part: 19,
      },
      {
        type: 'contribution_annuelle',
        libelle: 'Contribution annuelle',
        en_ligne: 44000,
        especes: 0,
        total: 44000,
        nombre: 6,
        part: 4,
      },
    ],
    par_fonds: [
      {
        fonds_id: '00000000-0000-4000-8000-000000000001',
        titre: 'Quête dominicale',
        type: 'quete_dominicale',
        destination: 'paroisse',
        en_ligne: 47405,
        especes: 212500,
        total: 259905,
        nombre: 9,
        part: 21,
      },
      {
        fonds_id: '00000000-0000-4000-8000-000000000002',
        titre: 'Quête impérée · Grand Séminaire de Brin',
        type: 'quete_imperee',
        destination: 'curie',
        en_ligne: 28525,
        especes: 646000,
        total: 674525,
        nombre: 10,
        part: 56,
      },
      {
        fonds_id: '00000000-0000-4000-8000-000000000003',
        titre: 'Toiture de la chapelle',
        type: 'campagne',
        destination: 'paroisse',
        en_ligne: 236400,
        especes: 0,
        total: 236400,
        nombre: 31,
        part: 19,
      },
      {
        fonds_id: '00000000-0000-4000-8000-000000000004',
        titre: 'Contribution annuelle 2026',
        type: 'contribution_annuelle',
        destination: 'paroisse',
        en_ligne: 44000,
        especes: 0,
        total: 44000,
        nombre: 6,
        part: 4,
      },
    ],
    par_canal: [
      {
        canal: 'en_ligne',
        libelle: 'En ligne',
        total: 356330,
        nombre: 47,
        part: 29,
        sources: [
          {
            source: 'app_ios',
            libelle: 'App iOS',
            total: 61500,
            nombre: 8,
            part: 17,
          },
          {
            source: 'app_android',
            libelle: 'App Android',
            total: 199000,
            nombre: 26,
            part: 56,
          },
          {
            source: 'web',
            libelle: 'Site',
            total: 95830,
            nombre: 13,
            part: 27,
          },
        ],
      },
      {
        canal: 'especes',
        libelle: 'Espèces',
        total: 858500,
        nombre: 9,
        part: 71,
        sources: [],
      },
    ],
    par_moyen: [
      { moyen: 'wave', libelle: 'Wave', total: 208450, nombre: 29, part: 58 },
      {
        moyen: 'orange_money',
        libelle: 'Orange Money',
        total: 106380,
        nombre: 14,
        part: 30,
      },
      {
        moyen: 'free_money',
        libelle: 'Free Money',
        total: 0,
        nombre: 0,
        part: 0,
      },
      {
        moyen: 'carte',
        libelle: 'Carte bancaire',
        total: 41500,
        nombre: 4,
        part: 12,
      },
    ],
    par_lieu: [
      {
        lieu_id: 1,
        nom: 'Église Saint-Dominique',
        en_ligne: 0,
        especes: 775000,
        total: 775000,
        nombre: 7,
        part: 64,
      },
      {
        lieu_id: 2,
        nom: 'Chapelle de la Cité universitaire',
        en_ligne: 0,
        especes: 83500,
        total: 83500,
        nombre: 2,
        part: 7,
      },
      {
        lieu_id: null,
        nom: 'Lieu non renseigné',
        en_ligne: 356330,
        especes: 0,
        total: 356330,
        nombre: 47,
        part: 29,
      },
    ],
  },
  tendance: {
    grain: 'semaine',
    points: [
      {
        debut: '2026-09-01',
        fin: '2026-09-06',
        libelle: 'au dim. 6',
        total: 71500,
        en_ligne: 71500,
        especes: 0,
        par_type_fonds: {
          quete_dominicale: 3000,
          quete_imperee: 0,
          campagne: 60500,
          contribution_annuelle: 8000,
        },
      },
      {
        debut: '2026-09-07',
        fin: '2026-09-13',
        libelle: 'au dim. 13',
        total: 84250,
        en_ligne: 84250,
        especes: 0,
        par_type_fonds: {
          quete_dominicale: 2905,
          quete_imperee: 0,
          campagne: 71345,
          contribution_annuelle: 10000,
        },
      },
      {
        debut: '2026-09-14',
        fin: '2026-09-20',
        libelle: 'au dim. 20',
        total: 297805,
        en_ligne: 85305,
        especes: 212500,
        par_type_fonds: {
          quete_dominicale: 215500,
          quete_imperee: 0,
          campagne: 64305,
          contribution_annuelle: 18000,
        },
      },
      {
        debut: '2026-09-21',
        fin: '2026-09-27',
        libelle: 'au dim. 27',
        total: 761275,
        en_ligne: 115275,
        especes: 646000,
        par_type_fonds: {
          quete_dominicale: 38500,
          quete_imperee: 674525,
          campagne: 40250,
          contribution_annuelle: 8000,
        },
      },
    ],
  },
  a_traiter: [
    {
      type: 'paiements_en_attente',
      echeance: '2026-09-28',
      libelle: '3 paiement(s) en attente de confirmation',
      nombre: 3,
      montant: 18000,
      depuis: '2026-09-27T01:00:00Z',
      paroisse: null,
      objet_id: null,
    },
    {
      type: 'quete_a_confirmer',
      echeance: '2026-09-29',
      libelle:
        'Quête à confirmer : Chapelle de la Cité universitaire, Messe de 17 h, 27/09',
      nombre: 1,
      montant: 64000,
      depuis: '2026-09-27T18:30:00Z',
      paroisse: null,
      objet_id: '10',
    },
    {
      type: 'especes_a_deposer',
      echeance: '2026-10-03',
      libelle: 'Espèces à déposer en banque',
      nombre: 5,
      montant: 646000,
      depuis: '2026-09-26T20:00:00Z',
      paroisse: null,
      objet_id: null,
    },
    {
      type: 'remise_curie',
      echeance: '2026-10-04',
      libelle:
        'Quête impérée · Grand Séminaire de Brin : espèces à remettre à la curie',
      nombre: 1,
      montant: 646000,
      depuis: null,
      paroisse: null,
      objet_id: '00000000-0000-4000-8000-000000000002',
    },
  ],
  paroisses: null,
  quetes_imperees: [QUETE_IMPEREE_SEPTEMBRE],
  tresorerie: {
    en_ligne: {
      paye: 356330,
      frais: 7120,
      frais_reels: 7120,
      net: 349210,
      reverse: 301480,
      en_attente_reversement: 47730,
      part_reversee: 86,
      net_pour_100: 98,
      dons_frais_couverts: 0,
      nombre: 47,
    },
    especes: {
      validees: 858500,
      deposees: 212500,
      en_caisse: 646000,
      a_confirmer: 64000,
    },
  },
  paiements: {
    lances: 58,
    confirmes: 47,
    en_attente: 3,
    echoues: 4,
    expires: 4,
    taux_confirmation: 81,
  },
  campagnes: [
    {
      fonds_id: '00000000-0000-4000-8000-000000000003',
      titre: 'Toiture de la chapelle',
      objectif: 4500000,
      reuni: 1186400,
      part: 26,
      nombre: 57,
      periode: 236400,
      debut: '2026-06-01',
      fin: '2026-12-31',
      statut: 'ouvert',
      rythme_hebdo: 59100,
      projection_fin: 1988471,
      part_projection: 44,
    },
  ],
  notes: [
    'Les quêtes en espèces sont saisies sur Jàngu Bi depuis le 20 septembre.',
    "Comparaison avec l'an dernier disponible à partir de juin 2027.",
    'Montants en FCFA. Aucun nom de donateur dans cette vue.',
  ],
};

const paroisseEnPreparation = (id: string, nom: string) => ({
  id,
  nom,
  statut_collecte: 'en_preparation' as const,
  collecte: null,
  part_en_ligne: null,
  quetes_a_valider: null,
  evolution: null,
});

export const analyseDioceseSeptembre: AnalyseDons = {
  niveau: 'diocese',
  noeud: {
    id: NOEUD_ARCHIDIOCESE,
    nom: 'Archidiocèse de Dakar',
    type: 'diocese',
  },
  periode: PERIODE_SEPTEMBRE,
  genere_le: GENERE_LE,
  confidentialite: { arrondi: 1000, ...CONFIDENTIALITE },
  synthese: {
    collecte: 1215000,
    en_ligne: 356000,
    especes: 859000,
    nombre_dons_en_ligne: 47,
    nombre_quetes: 9,
    par_destination: { paroisse: 540000, curie: 675000 },
    par_type_fonds: [
      {
        type: 'quete_dominicale',
        libelle: 'Quête dominicale',
        en_ligne: 47000,
        especes: 213000,
        total: 260000,
        nombre: 9,
        part: 21,
      },
      {
        type: 'quete_imperee',
        libelle: 'Quête impérée',
        en_ligne: 29000,
        especes: 646000,
        total: 675000,
        nombre: 10,
        part: 56,
      },
      {
        type: 'campagne',
        libelle: 'Campagne pour un projet',
        en_ligne: 236000,
        especes: 0,
        total: 236000,
        nombre: 31,
        part: 19,
      },
      {
        type: 'contribution_annuelle',
        libelle: 'Contribution annuelle',
        en_ligne: 44000,
        especes: 0,
        total: 44000,
        nombre: 6,
        part: 4,
      },
    ],
    par_fonds: null,
    par_canal: [
      {
        canal: 'en_ligne',
        libelle: 'En ligne',
        total: 356000,
        nombre: 47,
        part: 29,
        sources: [
          {
            source: 'app_ios',
            libelle: 'App iOS',
            total: 62000,
            nombre: 8,
            part: 17,
          },
          {
            source: 'app_android',
            libelle: 'App Android',
            total: 199000,
            nombre: 26,
            part: 56,
          },
          {
            source: 'web',
            libelle: 'Site',
            total: 96000,
            nombre: 13,
            part: 27,
          },
        ],
      },
      {
        canal: 'especes',
        libelle: 'Espèces',
        total: 859000,
        nombre: 9,
        part: 71,
        sources: [],
      },
    ],
    par_moyen: [
      { moyen: 'wave', libelle: 'Wave', total: 208000, nombre: 29, part: 58 },
      {
        moyen: 'orange_money',
        libelle: 'Orange Money',
        total: 106000,
        nombre: 14,
        part: 30,
      },
      {
        moyen: 'free_money',
        libelle: 'Free Money',
        total: 0,
        nombre: 0,
        part: 0,
      },
      {
        moyen: 'carte',
        libelle: 'Carte bancaire',
        total: 42000,
        nombre: 4,
        part: 12,
      },
    ],
    par_lieu: null,
  },
  tendance: {
    grain: 'semaine',
    points: [
      {
        debut: '2026-09-01',
        fin: '2026-09-06',
        libelle: 'au dim. 6',
        total: 72000,
        en_ligne: 72000,
        especes: 0,
        par_type_fonds: {
          quete_dominicale: 3000,
          quete_imperee: 0,
          campagne: 61000,
          contribution_annuelle: 8000,
        },
      },
      {
        debut: '2026-09-07',
        fin: '2026-09-13',
        libelle: 'au dim. 13',
        total: 84000,
        en_ligne: 84000,
        especes: 0,
        par_type_fonds: {
          quete_dominicale: 3000,
          quete_imperee: 0,
          campagne: 71000,
          contribution_annuelle: 10000,
        },
      },
      {
        debut: '2026-09-14',
        fin: '2026-09-20',
        libelle: 'au dim. 20',
        total: 298000,
        en_ligne: 85000,
        especes: 213000,
        par_type_fonds: {
          quete_dominicale: 216000,
          quete_imperee: 0,
          campagne: 64000,
          contribution_annuelle: 18000,
        },
      },
      {
        debut: '2026-09-21',
        fin: '2026-09-27',
        libelle: 'au dim. 27',
        total: 761000,
        en_ligne: 115000,
        especes: 646000,
        par_type_fonds: {
          quete_dominicale: 39000,
          quete_imperee: 675000,
          campagne: 40000,
          contribution_annuelle: 8000,
        },
      },
    ],
  },
  a_traiter: [
    {
      type: 'quete_a_confirmer',
      echeance: '2026-09-29',
      libelle: 'Saint-Dominique : 1 quête(s) à confirmer',
      nombre: 1,
      montant: null,
      depuis: null,
      paroisse: { id: NOEUD_SAINT_DOMINIQUE, nom: 'Saint-Dominique' },
      objet_id: null,
    },
    {
      type: 'remise_curie',
      echeance: '2026-10-04',
      libelle:
        'Quête impérée · Grand Séminaire de Brin : espèces de Saint-Dominique à remettre',
      nombre: 1,
      montant: 646000,
      depuis: null,
      paroisse: { id: NOEUD_SAINT_DOMINIQUE, nom: 'Saint-Dominique' },
      objet_id: '00000000-0000-4000-8000-000000000002',
    },
  ],
  paroisses: {
    compteurs: { engagees: 5, collecte_ouverte: 1, en_preparation: 4 },
    lignes: [
      paroisseEnPreparation(
        '00000000-0000-4000-8000-000000000006',
        'Cathédrale Notre-Dame-des-Victoires',
      ),
      paroisseEnPreparation(
        '00000000-0000-4000-8000-000000000007',
        'Notre-Dame des Anges de Ouakam',
      ),
      {
        id: NOEUD_SAINT_DOMINIQUE,
        nom: 'Saint-Dominique',
        statut_collecte: 'ouverte',
        collecte: 1215000,
        part_en_ligne: 29,
        quetes_a_valider: 1,
        evolution: null,
      },
      paroisseEnPreparation(
        '00000000-0000-4000-8000-000000000008',
        'Saint-Joseph de Médina',
      ),
      paroisseEnPreparation(
        '00000000-0000-4000-8000-000000000009',
        'Sainte-Thérèse de Grand-Dakar',
      ),
    ],
  },
  quetes_imperees: [QUETE_IMPEREE_SEPTEMBRE],
  tresorerie: null,
  paiements: null,
  campagnes: null,
  notes: [
    'Les quêtes en espèces sont saisies sur Jàngu Bi depuis le 20 septembre.',
    "Comparaison avec l'an dernier disponible à partir de juin 2027.",
    'Montants arrondis au millier : la somme des lignes peut différer du total.',
    'Montants en FCFA. Aucun nom de donateur dans cette vue.',
  ],
};

/** Même paroisse, période sans aucun don (état vide) : clés toujours présentes. */
export const analyseParoisseVide = (periode: PeriodeAnalyse): AnalyseDons => ({
  ...analyseParoisseSeptembre,
  periode,
  synthese: {
    collecte: 0,
    en_ligne: 0,
    especes: 0,
    nombre_dons_en_ligne: 0,
    nombre_quetes: 0,
    par_destination: { paroisse: 0, curie: 0 },
    par_type_fonds: analyseParoisseSeptembre.synthese.par_type_fonds.map(
      (f) => ({
        ...f,
        en_ligne: 0,
        especes: 0,
        total: 0,
        nombre: 0,
        part: null,
      }),
    ),
    par_fonds: [],
    par_canal: [],
    par_moyen: [],
    par_lieu: [],
  },
  tendance: { grain: 'semaine', points: [] },
  a_traiter: [],
  quetes_imperees: [],
  tresorerie: {
    en_ligne: {
      paye: 0,
      frais: 0,
      frais_reels: 0,
      net: 0,
      reverse: 0,
      en_attente_reversement: 0,
      part_reversee: null,
      net_pour_100: null,
      dons_frais_couverts: 0,
      nombre: 0,
    },
    especes: { validees: 0, deposees: 0, en_caisse: 0, a_confirmer: 0 },
  },
  paiements: {
    lances: 0,
    confirmes: 0,
    en_attente: 0,
    echoues: 0,
    expires: 0,
    taux_confirmation: null,
  },
  campagnes: [],
  notes: ['Montants en FCFA. Aucun nom de donateur dans cette vue.'],
});

// ------------------------------------------------------------- plateforme

// Confirmés par jour du 3 au 26 septembre (41 au total) ; le 1er (3), le 2 (1)
// et le 27 (2 confirmés, 3 en attente) sont ceux du contrat §3.1.
const CONFIRMES = [
  1, 2, 1, 2, 1, 3, 1, 1, 2, 1, 2, 1, 3, 2, 1, 1, 2, 4, 1, 2, 1, 2, 1, 3,
];
const JOURS_ECHEC = new Set([8, 14, 19, 25]);
const JOURS_EXPIRE = new Set([6, 12, 20, 26]);
const HEURES = [11, 16, 18, 20, 21, 9, 12, 19, 13, 17];

const PAR_JOUR: ActivitePlateforme['par_jour'] = Array.from(
  { length: 27 },
  (_, i) => {
    const jour = i + 1;
    const date = `2026-09-${String(jour).padStart(2, '0')}`;
    if (jour === 1)
      return {
        date,
        lances: 3,
        confirmes: 3,
        en_attente: 0,
        echoues: 0,
        expires: 0,
      };
    if (jour === 2)
      return {
        date,
        lances: 1,
        confirmes: 1,
        en_attente: 0,
        echoues: 0,
        expires: 0,
      };
    if (jour === 27)
      return {
        date,
        lances: 5,
        confirmes: 2,
        en_attente: 3,
        echoues: 0,
        expires: 0,
      };
    const confirmes = CONFIRMES[jour - 3];
    const echoues = JOURS_ECHEC.has(jour) ? 1 : 0;
    const expires = JOURS_EXPIRE.has(jour) ? 1 : 0;
    return {
      date,
      lances: confirmes + echoues + expires,
      confirmes,
      en_attente: 0,
      echoues,
      expires,
    };
  },
);

// Carte jour × heure des paiements lancés, cases non nulles, dans l'ordre
// jour puis heure (1 = lundi ; le 1er septembre 2026 est un mardi).
const CHARGE: ActivitePlateforme['charge'] = (() => {
  const cases = new Map<string, number>();
  PAR_JOUR.forEach((j, i) => {
    const jourSemaine = ((i + 1) % 7) + 1;
    for (let k = 0; k < j.lances; k += 1) {
      const heure = HEURES[(i + k) % HEURES.length];
      const cle = `${jourSemaine}-${heure}`;
      cases.set(cle, (cases.get(cle) ?? 0) + 1);
    }
  });
  return [...cases.entries()]
    .map(([cle, nombre]) => {
      const [jour_semaine, heure] = cle.split('-').map(Number);
      return { jour_semaine, heure, nombre };
    })
    .sort((a, b) => a.jour_semaine - b.jour_semaine || a.heure - b.heure);
})();

const paroissePlateforme = (id: string, nom: string) => ({
  id,
  nom,
  collecte_ouverte: false,
  lances: 0,
  confirmes: 0,
  en_attente: 0,
  echoues: 0,
  expires: 0,
  taux_confirmation: null,
  derniere_confirmation: null,
  quetes_saisies: 0,
});

export const activitePlateformeSeptembre: ActivitePlateforme = {
  periode: PERIODE_SEPTEMBRE,
  genere_le: GENERE_LE,
  paiements: {
    lances: 58,
    confirmes: 47,
    en_attente: 3,
    echoues: 4,
    expires: 4,
    rembourses: 0,
    taux_confirmation: 81,
    taux_echec: 14,
    plus_ancien_en_attente: '2026-09-27T01:00:00Z',
  },
  delais: {
    confirmation_mediane_s: 41,
    confirmation_p95_s: 41,
    reversement_moyen_jours: 13,
    reversement_median_jours: 13,
    echantillon_confirmation: 47,
  },
  par_jour: PAR_JOUR,
  par_moyen: [
    { moyen: 'wave', libelle: 'Wave', confirmes: 29, echecs: 0, taux_echec: 0 },
    {
      moyen: 'orange_money',
      libelle: 'Orange Money',
      confirmes: 14,
      echecs: 0,
      taux_echec: 0,
    },
    {
      moyen: 'free_money',
      libelle: 'Free Money',
      confirmes: 0,
      echecs: 0,
      taux_echec: null,
    },
    {
      moyen: 'carte',
      libelle: 'Carte bancaire',
      confirmes: 4,
      echecs: 0,
      taux_echec: 0,
    },
    {
      moyen: 'inconnu',
      libelle: 'Inconnu',
      confirmes: 0,
      echecs: 8,
      taux_echec: 100,
    },
  ],
  par_source: [
    {
      source: 'app_ios',
      libelle: 'App iOS',
      lances: 12,
      confirmes: 8,
      taux_confirmation: 67,
      retours: 0,
      taux_retour: 0,
    },
    {
      source: 'app_android',
      libelle: 'App Android',
      lances: 29,
      confirmes: 26,
      taux_confirmation: 90,
      retours: 0,
      taux_retour: 0,
    },
    {
      source: 'web',
      libelle: 'Site',
      lances: 17,
      confirmes: 13,
      taux_confirmation: 76,
      retours: 0,
      taux_retour: 0,
    },
  ],
  par_paroisse: [
    paroissePlateforme(
      '00000000-0000-4000-8000-000000000006',
      'Cathédrale Notre-Dame-des-Victoires',
    ),
    paroissePlateforme(
      '00000000-0000-4000-8000-000000000007',
      'Notre-Dame des Anges de Ouakam',
    ),
    {
      id: NOEUD_SAINT_DOMINIQUE,
      nom: 'Saint-Dominique',
      collecte_ouverte: true,
      lances: 58,
      confirmes: 47,
      en_attente: 3,
      echoues: 4,
      expires: 4,
      taux_confirmation: 81,
      derniere_confirmation: '2026-09-27T16:08:00Z',
      quetes_saisies: 10,
    },
    paroissePlateforme(
      '00000000-0000-4000-8000-000000000008',
      'Saint-Joseph de Médina',
    ),
    paroissePlateforme(
      '00000000-0000-4000-8000-000000000009',
      'Sainte-Thérèse de Grand-Dakar',
    ),
  ],
  notifications: {
    recues: 0,
    traitees: 0,
    doublons: 0,
    rejetees: 0,
    erreurs: 0,
    en_cours: 0,
    derniere_recue: null,
  },
  charge: CHARGE,
  incidents: { ouverts: 0, par_type: {}, liste: [] },
  reversements: { a_rapprocher: 0, en_ecart: 0 },
};

// ---------------------------------------------------------------- handlers

const MOIS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

const PERIODES_EN_COURS: Record<string, PeriodeAnalyse> = {
  semaine: {
    type: 'semaine',
    code: '2026-W39',
    debut: '2026-09-21',
    fin: '2026-09-27',
    libelle: 'semaine du 21 au 27 sept. 2026',
  },
  mois: PERIODE_SEPTEMBRE,
  trimestre: {
    type: 'trimestre',
    code: '2026-T3',
    debut: '2026-07-01',
    fin: '2026-09-30',
    libelle: '3e trimestre 2026',
  },
  annee: {
    type: 'annee',
    code: '2026',
    debut: '2026-01-01',
    fin: '2026-12-31',
    libelle: 'année 2026',
  },
};

const GRAIN: Record<string, 'jour' | 'semaine' | 'mois'> = {
  semaine: 'jour',
  mois: 'semaine',
  trimestre: 'mois',
  annee: 'mois',
};

const erreur = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message, details: {} } }, { status });

/** Période d'un mois `AAAA-MM` sans don (le pilote démarre en septembre 2026). */
const periodeMois = (date: string): PeriodeAnalyse => {
  const [a, m] = date.split('-').map(Number);
  const fin = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return {
    type: 'mois',
    code: date,
    debut: `${date}-01`,
    fin: `${date}-${fin}`,
    libelle: `${MOIS_FR[m - 1]} ${a}`,
  };
};

const encodeur = new TextEncoder();

export const donsAnalyseHandlers = [
  http.get(`${env.API_URL}/v1/me/capacites/`, () =>
    HttpResponse.json(mesCapacitesDemo),
  ),

  http.get(`${env.API_URL}/v1/staff/dons/analyse/`, ({ request }) => {
    const url = new URL(request.url);
    const niveau = url.searchParams.get('niveau');
    const noeud = url.searchParams.get('noeud');
    const periode = url.searchParams.get('periode') ?? 'mois';
    const date = url.searchParams.get('date');

    if (!noeud || (niveau !== 'paroisse' && niveau !== 'diocese')) {
      return erreur(400, 'validation_error', 'Paramètres invalides.');
    }
    if (!(periode in PERIODES_EN_COURS)) {
      return erreur(400, 'invalid_period', 'Période inconnue.');
    }

    if (niveau === 'diocese') {
      if (noeud !== NOEUD_ARCHIDIOCESE) {
        return erreur(
          400,
          'not_an_aggregate_node',
          "Ce nœud n'est ni un diocèse ni un doyenné.",
        );
      }
      if (periode === 'semaine') {
        return erreur(
          400,
          'period_not_allowed',
          'La semaine est réservée à la paroisse.',
        );
      }
      return HttpResponse.json({
        ...analyseDioceseSeptembre,
        periode: PERIODES_EN_COURS[periode],
        tendance: {
          ...analyseDioceseSeptembre.tendance,
          grain: GRAIN[periode],
        },
      });
    }

    if (noeud !== NOEUD_SAINT_DOMINIQUE) {
      return erreur(400, 'not_a_parish', "Ce nœud n'est pas une paroisse.");
    }
    // Un autre mois que septembre 2026 : période sans don.
    if (periode === 'mois' && date && date !== '2026-09') {
      if (!/^\d{4}-\d{2}$/.test(date)) {
        return erreur(400, 'invalid_period', 'Date mal formée.');
      }
      return HttpResponse.json(analyseParoisseVide(periodeMois(date)));
    }
    return HttpResponse.json({
      ...analyseParoisseSeptembre,
      periode: PERIODES_EN_COURS[periode],
      tendance: { ...analyseParoisseSeptembre.tendance, grain: GRAIN[periode] },
    });
  }),

  // Flux SSE (TEMPS-REEL.md §3) : l'en-tête du flux, puis un battement toutes
  // les 15 s ; le flux reste ouvert jusqu'à ce que le client s'en aille.
  http.get(`${env.API_URL}/v1/staff/dons/flux/`, ({ request }) => {
    const noeud = new URL(request.url).searchParams.get('noeud');
    if (!request.headers.get('authorization')) {
      return erreur(401, 'not_authenticated', 'Authentification requise.');
    }
    if (noeud !== NOEUD_SAINT_DOMINIQUE && noeud !== NOEUD_ARCHIDIOCESE) {
      return erreur(404, 'not_found', 'Nœud inconnu.');
    }
    let battement: ReturnType<typeof setInterval> | undefined;
    const flux = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encodeur.encode(`retry: 5000\n: flux dons.${noeud}\n\n`),
        );
        battement = setInterval(() => {
          try {
            controller.enqueue(encodeur.encode(': ping\n\n'));
          } catch {
            clearInterval(battement);
          }
        }, 15_000);
        request.signal.addEventListener('abort', () => {
          clearInterval(battement);
          try {
            controller.close();
          } catch {
            // déjà fermé
          }
        });
      },
      cancel() {
        clearInterval(battement);
      },
    });
    return new HttpResponse(flux, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  }),

  http.get(`${env.API_URL}/v1/platform/dons/activite/`, ({ request }) => {
    const periode = new URL(request.url).searchParams.get('periode') ?? 'mois';
    return HttpResponse.json({
      ...activitePlateformeSeptembre,
      periode: PERIODES_EN_COURS[periode] ?? PERIODE_SEPTEMBRE,
    });
  }),
];
