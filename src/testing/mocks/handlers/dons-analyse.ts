import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type { ActivitePlateforme } from '@/features/dons-analyse/api/get-activite-plateforme';
import type {
  AnalyseDiocese,
  AnalyseParoisse,
} from '@/features/dons-analyse/api/get-analyse-dons';

// Jeu de données de référence des tableaux de bord des dons (spec
// ECRANS-TABLEAU-DE-BORD-DONS §2) : Saint-Dominique, septembre 2026, arrêté au
// 28 sept., 9:15. Fictif.

const ARRETE_AU = '2026-09-28T09:15:00Z';

const PERIODE_SEPTEMBRE = {
  granularite: 'mois' as const,
  debut: '2026-09-01',
  fin: '2026-09-30',
  libelle: 'septembre 2026',
  en_cours: true,
};

export const analyseParoisseSeptembre: AnalyseParoisse = {
  portee: 'paroisse',
  lieu: {
    id: '5d1c3a8e-0000-4000-8000-000000000001',
    nom: 'Saint-Dominique',
    diocese: 'Archidiocèse de Dakar',
  },
  periode: PERIODE_SEPTEMBRE,
  arrete_au: ARRETE_AU,
  collecte: {
    total: 1214830,
    en_ligne: 356330,
    en_ligne_nombre: 47,
    especes: 858500,
    especes_quetes: 9,
    pour_paroisse: 540305,
    pour_curie: 674525,
    quete_imperee_libelle: 'Grand Séminaire de Brin',
    a_confirmer: { montant: 64000, nombre: 1 },
  },
  par_fonds: [
    { type: 'quete_dominicale', libelle: 'Quête dominicale', montant: 259905 },
    {
      type: 'quete_imperee',
      libelle: 'Quête impérée · Grand Séminaire de Brin',
      montant: 674525,
    },
    {
      type: 'campagne',
      libelle: 'Campagne · toiture de la chapelle',
      montant: 236400,
    },
    {
      type: 'contribution_annuelle',
      libelle: 'Contribution annuelle 2026',
      montant: 44000,
    },
  ],
  par_semaine: [
    {
      debut: '2026-09-01',
      fin: '2026-09-06',
      libelle: '1er-6 sept.',
      sous_libelle: 'dim. 6',
      valeurs: {
        quete_dominicale: 3000,
        quete_imperee: 0,
        campagne: 60500,
        contribution_annuelle: 8000,
      },
      total: 71500,
    },
    {
      debut: '2026-09-07',
      fin: '2026-09-13',
      libelle: '7-13 sept.',
      sous_libelle: 'dim. 13',
      valeurs: {
        quete_dominicale: 2905,
        quete_imperee: 0,
        campagne: 71345,
        contribution_annuelle: 10000,
      },
      total: 84250,
    },
    {
      debut: '2026-09-14',
      fin: '2026-09-20',
      libelle: '14-20 sept.',
      sous_libelle: 'dim. 20',
      valeurs: {
        quete_dominicale: 215500,
        quete_imperee: 0,
        campagne: 64305,
        contribution_annuelle: 18000,
      },
      total: 297805,
    },
    {
      debut: '2026-09-21',
      fin: '2026-09-27',
      libelle: '21-27 sept.',
      sous_libelle: 'dim. 27',
      valeurs: {
        quete_dominicale: 38500,
        quete_imperee: 674525,
        campagne: 40250,
        contribution_annuelle: 8000,
      },
      total: 761275,
    },
  ],
  par_canal: [
    {
      code: 'en_ligne',
      libelle: 'En ligne',
      montant: 356330,
      nombre: 47,
      niveau: 0,
      unite: 'dons',
      non_renseigne: false,
    },
    {
      code: 'app_android',
      libelle: 'App Android',
      montant: 199000,
      nombre: 26,
      niveau: 1,
      unite: 'dons',
      non_renseigne: false,
    },
    {
      code: 'web',
      libelle: 'Site',
      montant: 95830,
      nombre: 13,
      niveau: 1,
      unite: 'dons',
      non_renseigne: false,
    },
    {
      code: 'app_ios',
      libelle: 'App iOS',
      montant: 61500,
      nombre: 8,
      niveau: 1,
      unite: 'dons',
      non_renseigne: false,
    },
    {
      code: 'especes',
      libelle: 'Espèces',
      montant: 858500,
      nombre: 9,
      niveau: 0,
      unite: 'quêtes',
      non_renseigne: false,
    },
  ],
  par_moyen: [
    {
      code: 'especes',
      libelle: 'Espèces',
      montant: 858500,
      nombre: 9,
      niveau: 0,
      unite: 'quêtes',
      non_renseigne: false,
    },
    {
      code: 'wave',
      libelle: 'Wave',
      montant: 208450,
      nombre: 29,
      niveau: 0,
      unite: 'dons',
      non_renseigne: false,
    },
    {
      code: 'orange_money',
      libelle: 'Orange Money',
      montant: 106380,
      nombre: 14,
      niveau: 0,
      unite: 'dons',
      non_renseigne: false,
    },
    {
      code: 'free_money',
      libelle: 'Free Money',
      montant: 0,
      nombre: 0,
      niveau: 0,
      unite: 'dons',
      non_renseigne: false,
    },
    {
      code: 'carte',
      libelle: 'Carte',
      montant: 41500,
      nombre: 4,
      niveau: 0,
      unite: 'dons',
      non_renseigne: false,
    },
  ],
  par_lieu: [
    {
      code: 'eglise',
      libelle: 'Église Saint-Dominique',
      montant: 775000,
      nombre: 7,
      niveau: 0,
      unite: 'quêtes',
      non_renseigne: false,
    },
    {
      code: 'chapelle_cite',
      libelle: 'Chapelle de la Cité universitaire',
      montant: 83500,
      nombre: 2,
      niveau: 0,
      unite: 'quêtes',
      non_renseigne: false,
    },
    {
      code: 'non_renseigne',
      libelle: 'Dons en ligne : lieu non renseigné',
      montant: 356330,
      nombre: 47,
      niveau: 0,
      unite: 'dons',
      non_renseigne: true,
    },
  ],
  paiements: {
    lances: 58,
    confirmes: 47,
    en_attente: 3,
    echoues: 4,
    expires: 4,
    plus_ancien_attente_depuis: '2026-09-27T14:15:00Z',
    delai_median_s: 41,
  },
  tresorerie: {
    paye_en_ligne: 356330,
    frais: 7120,
    net_en_ligne: 349210,
    reverse: 301480,
    reverse_le: '2026-09-25',
    en_attente_reversement: 47730,
    dons_frais_couverts: 12,
    net_pour_100: 98,
    especes_validees: 858500,
    especes_deposees: 212500,
    especes_en_caisse: 646000,
    quete_a_confirmer: 64000,
  },
  campagnes: [
    {
      id: 'toiture',
      titre: 'toiture de la chapelle',
      debut: '2026-06-01',
      fin: '2026-12-31',
      objectif: 4500000,
      reuni: 1186400,
      nombre_dons: 57,
      montant_periode: 236400,
      rythme_hebdo: 59100,
      projection_fin: 1978000,
      cumul: [
        { mois: '2026-06', cumul: 214000 },
        { mois: '2026-07', cumul: 482000 },
        { mois: '2026-08', cumul: 950000 },
        { mois: '2026-09', cumul: 1186400 },
      ],
    },
  ],
  // Volontairement dans le désordre : l'écran trie par échéance.
  a_traiter: [
    {
      id: 'depot-especes',
      type: 'depot_especes',
      titre: "646 000 FCFA d'espèces à déposer à la banque",
      echeance: '2026-09-30T18:00:00Z',
      detail: 'en caisse depuis le 27 sept.',
    },
    {
      id: 'remise-curie',
      type: 'remise_curie',
      titre: 'Quête impérée : 646 000 FCFA en espèces à remettre à la curie',
      echeance: '2026-10-04T00:00:00Z',
      detail: 'Grand Séminaire de Brin',
    },
    {
      id: 'paiements-attente',
      type: 'paiements_en_attente',
      titre: '3 paiements en ligne en attente',
      echeance: '2026-09-28T14:15:00Z',
      detail: 'le plus ancien depuis 19 h ; il expire à l’échéance',
    },
    {
      id: 'quete-a-confirmer',
      type: 'quete_a_confirmer',
      titre:
        'Quête de 17 h à la chapelle de la Cité universitaire : 64 000 FCFA',
      echeance: '2026-09-28T18:00:00Z',
      detail: 'dim. 27 · non comptée',
    },
  ],
  notes: {
    par_semaine: [
      'La quête impérée du 27 septembre a remplacé la quête ordinaire à toutes les messes : lisez les deux fonds ensemble.',
      'Les quêtes en espèces sont saisies sur Jàngu Bi depuis le 20 septembre.',
    ],
  },
};

/** Même paroisse, période sans aucun don (état vide). */
export const analyseParoisseVide = (
  periode: AnalyseParoisse['periode'],
): AnalyseParoisse => ({
  ...analyseParoisseSeptembre,
  periode,
  collecte: {
    ...analyseParoisseSeptembre.collecte,
    total: 0,
    en_ligne: 0,
    en_ligne_nombre: 0,
    especes: 0,
    especes_quetes: 0,
    pour_paroisse: 0,
    pour_curie: 0,
    quete_imperee_libelle: null,
    a_confirmer: null,
  },
  par_fonds: [],
  par_semaine: [],
  par_canal: [],
  par_moyen: [],
  par_lieu: [],
  paiements: {
    lances: 0,
    confirmes: 0,
    en_attente: 0,
    echoues: 0,
    expires: 0,
    plus_ancien_attente_depuis: null,
    delai_median_s: null,
  },
  tresorerie: {
    paye_en_ligne: 0,
    frais: 0,
    net_en_ligne: 0,
    reverse: 0,
    reverse_le: null,
    en_attente_reversement: 0,
    dons_frais_couverts: 0,
    net_pour_100: 0,
    especes_validees: 0,
    especes_deposees: 0,
    especes_en_caisse: 0,
    quete_a_confirmer: 0,
  },
  campagnes: [],
  a_traiter: [],
  notes: { par_semaine: [] },
});

const PAROISSE_EN_PREPARATION = {
  statut: 'en_preparation' as const,
  note: null,
  collecte: null,
  part_en_ligne: null,
  quetes_a_valider: null,
  evolution: null,
  evolution_libelle: null,
};

const QUETE_NON_OUVERTE = {
  ouverte: false,
  en_ligne: null,
  especes: null,
  total: null,
  remis: null,
  reste: null,
  echeance: null,
};

// Montants arrondis au millier par le serveur ; paroisses volontairement hors
// de l'ordre alphabétique : l'écran les trie.
export const analyseDioceseSeptembre: AnalyseDiocese = {
  portee: 'diocese',
  diocese: {
    id: '5d1c3a8e-0000-4000-8000-0000000000d1',
    nom: 'Archidiocèse de Dakar',
    province: 'Province de Dakar',
  },
  periode: PERIODE_SEPTEMBRE,
  arrete_au: ARRETE_AU,
  collecte: {
    total: 1215000,
    pour_curie: 675000,
    paroisses_engagees: 5,
    paroisses_actives: 1,
    paroisses_en_preparation: 4,
  },
  par_fonds: [
    { type: 'quete_dominicale', libelle: 'Quête dominicale', montant: 260000 },
    {
      type: 'quete_imperee',
      libelle: 'Quête impérée · Grand Séminaire de Brin',
      montant: 675000,
    },
    { type: 'campagne', libelle: 'Campagnes', montant: 236000 },
    {
      type: 'contribution_annuelle',
      libelle: 'Contribution annuelle',
      montant: 44000,
    },
  ],
  par_mois: [
    {
      mois: '2026-09',
      valeurs: {
        quete_dominicale: 260000,
        quete_imperee: 675000,
        campagne: 236000,
        contribution_annuelle: 44000,
      },
      total: 1215000,
    },
  ],
  premier_mois: '2026-09',
  paroisses: [
    {
      id: 'p-saint-dominique',
      nom: 'Saint-Dominique',
      doyenne: 'Plateau-Médina',
      note: 'paroisse pilote',
      statut: 'collecte_ouverte',
      collecte: 1215000,
      part_en_ligne: 29,
      quetes_a_valider: 1,
      evolution: null,
      evolution_libelle: 'Un seul mois',
    },
    {
      id: 'p-sainte-therese',
      nom: 'Sainte-Thérèse de Grand-Dakar',
      doyenne: 'Grand Dakar-Yoff',
      ...PAROISSE_EN_PREPARATION,
    },
    {
      id: 'p-cathedrale',
      nom: 'Cathédrale Notre-Dame-des-Victoires',
      doyenne: 'Plateau-Médina',
      ...PAROISSE_EN_PREPARATION,
    },
    {
      id: 'p-saint-joseph',
      nom: 'Saint-Joseph de Médina',
      doyenne: 'Plateau-Médina',
      ...PAROISSE_EN_PREPARATION,
    },
    {
      id: 'p-ouakam',
      nom: 'Notre-Dame des Anges de Ouakam',
      doyenne: 'Grand Dakar-Yoff',
      ...PAROISSE_EN_PREPARATION,
    },
  ],
  quete_imperee: {
    libelle: 'Grand Séminaire de Brin',
    sous_titre:
      'Quêtes des 26 et 27 sept., messe anticipée incluse · en FCFA, montants exacts (argent destiné à la curie)',
    lignes: [
      {
        paroisse_id: 'p-saint-dominique',
        nom: 'Saint-Dominique',
        ouverte: true,
        en_ligne: 28525,
        especes: 646000,
        total: 674525,
        remis: 0,
        reste: 646000,
        echeance: '2026-10-04',
      },
      {
        paroisse_id: 'p-sainte-therese',
        nom: 'Sainte-Thérèse de Grand-Dakar',
        ...QUETE_NON_OUVERTE,
      },
      {
        paroisse_id: 'p-cathedrale',
        nom: 'Cathédrale Notre-Dame-des-Victoires',
        ...QUETE_NON_OUVERTE,
      },
      {
        paroisse_id: 'p-saint-joseph',
        nom: 'Saint-Joseph de Médina',
        ...QUETE_NON_OUVERTE,
      },
      {
        paroisse_id: 'p-ouakam',
        nom: 'Notre-Dame des Anges de Ouakam',
        ...QUETE_NON_OUVERTE,
      },
    ],
  },
  compte_marchand: {
    recu: 301480,
    frais: 7120,
    confirme_non_reverse: 47730,
    ecarts_ouverts: 0,
    delai_moyen_jours: 9,
    dernier_reversement_le: '2026-09-25',
  },
  compte_liaison: [
    {
      libelle: "L'économat doit à Saint-Dominique",
      montant: 301480,
      detail:
        'Fonds paroissiaux reçus en ligne, net de la quête impérée en ligne.',
    },
    {
      libelle: 'Saint-Dominique doit à la curie',
      montant: 646000,
      detail: 'Quête impérée en espèces, à remettre avant le 4 oct.',
    },
  ],
};

const JOURS = ['22', '23', '24', '25', '26', '27', '28'].map(
  (j) => `2026-09-${j}`,
);

const CHARGE: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 1, 0, 1, 0, 0, 2, 0, 3, 4, 2, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 2, 3, 3, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 2, 2, 0, 0, 0, 0, 2, 0, 4, 4, 2, 0],
  [0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 2, 2, 1, 0, 0, 1, 0, 3, 5, 6, 3, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2, 1, 0, 0, 0, 1, 0, 2, 3, 6, 5, 3, 0],
  [0, 0, 0, 0, 0, 0, 0, 2, 7, 3, 4, 9, 3, 8, 2, 0, 1, 0, 1, 2, 3, 2, 0, 0],
  [1, 0, 0, 0, 0, 0, 1, 3, 6, 3],
];

const PAR_JOUR: [number, number, number, number, number][] = [
  // lancés, confirmés, en attente, échoués, expirés
  [3, 3, 0, 0, 0],
  [2, 1, 0, 0, 1],
  [3, 2, 0, 1, 0],
  [4, 4, 0, 0, 0],
  [5, 4, 0, 0, 1],
  [9, 6, 2, 1, 0],
  [2, 1, 1, 0, 0],
];

const DELAI: [number, number][] = [
  [38, 250],
  [45, 290],
  [40, 310],
  [52, 420],
  [39, 300],
  [36, 360],
  [41, 330],
];

export const activitePlateformeSeptembre: ActivitePlateforme = {
  periode: {
    granularite: 'mois',
    debut: '2026-09-01',
    fin: '2026-09-30',
    libelle: 'septembre 2026',
  },
  arrete_au: ARRETE_AU,
  paiements: {
    lances: 58,
    confirmes: 47,
    en_attente: 3,
    echoues: 4,
    expires: 4,
    plus_ancien_attente_depuis: '2026-09-27T14:15:00Z',
    derniere_notification_le: '2026-09-28T09:11:00Z',
  },
  par_jour: JOURS.map((date, i) => ({
    date,
    lances: PAR_JOUR[i][0],
    confirmes: PAR_JOUR[i][1],
    en_attente: PAR_JOUR[i][2],
    echoues: PAR_JOUR[i][3],
    expires: PAR_JOUR[i][4],
    partiel: i === JOURS.length - 1,
  })),
  delai: {
    median_s: 41,
    p95_s: 330,
    par_jour: JOURS.map((date, i) => ({
      date,
      median_s: DELAI[i][0],
      p95_s: DELAI[i][1],
    })),
    note: "Le pic du vendredi 25 suit un ralentissement de l'opérateur en soirée.",
  },
  notifications: {
    par_jour: JOURS.map((date, i) => ({
      date,
      recues: [14, 11, 15, 22, 19, 38, 12][i],
    })),
    recues: 131,
    traitees: 127,
    doublons: 2,
    rejetees: 0,
    erreurs: 2,
  },
  charge: {
    jours: JOURS.map((date, i) => ({ date, heures: CHARGE[i] })),
    total: 159,
    note: "Le dimanche, l'activité suit la fin des messes de 7 h, 9 h 30 et 11 h 30. En fin de mois, les soirées entre 20 h et 22 h sont les plus chargées. Le 25 à 3 h : notifications du reversement de l'agrégateur.",
  },
  sources: [
    { code: 'app_android', libelle: 'App Android', nombre: 26 },
    { code: 'web', libelle: 'Site', nombre: 13 },
    { code: 'app_ios', libelle: 'App iOS', nombre: 8 },
  ],
  retours_ios: { revenus: 6, total: 8 },
  paroisses: {
    parametrees: 5,
    activees: [
      {
        id: 'p-saint-dominique',
        nom: 'Saint-Dominique',
        derniere_confirmation_le: '2026-09-28T07:12:00Z',
      },
    ],
  },
  incidents: [
    {
      id: 'i1',
      date: '2026-09-27T21:48:00Z',
      reference: '6204-7731-0958',
      contexte: 'Saint-Dominique',
      nature: 'Notification reçue deux fois, la seconde ignorée',
      etat: 'doublon',
      action: null,
    },
    {
      id: 'i2',
      date: '2026-09-27T14:15:00Z',
      reference: '4903-3317-6620',
      contexte: 'Saint-Dominique',
      nature: 'Paiement en attente depuis 19 h, notification finale non reçue',
      etat: 'en_attente',
      action: 'relancer',
    },
    {
      id: 'i3',
      date: '2026-09-27T14:02:00Z',
      reference: '3391-5520-8147',
      contexte: 'Saint-Dominique',
      nature: 'Montant de la notification différent de celui du paiement',
      etat: 'a_examiner',
      action: 'acces_urgence',
    },
    {
      id: 'i4',
      date: '2026-09-26T20:15:00Z',
      reference: '7718-2046-3395',
      contexte: 'Saint-Dominique',
      nature: 'Montant de la notification différent de celui du paiement',
      etat: 'a_examiner',
      action: 'acces_urgence',
    },
    {
      id: 'i5',
      date: '2026-09-25T20:40:00Z',
      reference: null,
      contexte: 'Opérateur',
      nature: 'Confirmations ralenties pendant 50 min (délai jusqu’à 7 min)',
      etat: 'resolu',
      action: null,
    },
    {
      id: 'i6',
      date: '2026-09-23T12:07:00Z',
      reference: '2254-9186-4470',
      contexte: 'Saint-Dominique',
      nature: 'Notification reçue deux fois, la seconde ignorée',
      etat: 'doublon',
      action: null,
    },
  ],
};

const LIBELLES_GRANULARITE: Record<string, string> = {
  semaine: 'semaine du 21 au 27 sept. 2026',
  mois: 'septembre 2026',
  trimestre: '3e trimestre 2026',
  annee: 'année 2026',
};

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

export const donsAnalyseHandlers = [
  http.get(`${env.API_URL}/v1/staff/dons/analyse/`, ({ request }) => {
    const url = new URL(request.url);
    const portee = url.searchParams.get('portee') ?? 'paroisse';
    const granularite = url.searchParams.get('granularite') ?? 'mois';
    const date = url.searchParams.get('date');

    if (portee === 'diocese') {
      return HttpResponse.json(analyseDioceseSeptembre);
    }

    // Un autre mois que septembre 2026 : période sans don (le pilote démarre en
    // septembre 2026).
    if (granularite === 'mois' && date && date !== '2026-09') {
      const [a, m] = date.split('-').map(Number);
      const fin = new Date(Date.UTC(a, m, 0)).getUTCDate();
      return HttpResponse.json(
        analyseParoisseVide({
          granularite: 'mois',
          debut: `${date}-01`,
          fin: `${date}-${fin}`,
          libelle: `${MOIS_FR[m - 1]} ${a}`,
          en_cours: false,
        }),
      );
    }

    return HttpResponse.json({
      ...analyseParoisseSeptembre,
      periode: {
        ...analyseParoisseSeptembre.periode,
        granularite,
        libelle: LIBELLES_GRANULARITE[granularite] ?? 'septembre 2026',
      },
    });
  }),

  http.get(`${env.API_URL}/v1/platform/dons/activite/`, () =>
    HttpResponse.json(activitePlateformeSeptembre),
  ),
];
