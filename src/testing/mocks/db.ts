import type { Grant } from '@/lib/capacites';

/** Données de démonstration partagées par les handlers (reprises des maquettes). */
export const ids = {
  saintDominique: '0b7b1f0e-0000-4000-8000-000000000001',
  dakar: '0b7b1f0e-0000-4000-8000-000000000002',
  thies: '0b7b1f0e-0000-4000-8000-000000000003',
};

export const grantsSecretaire: Grant[] = [
  'annonces.publier',
  'evenements.gerer',
  'horaires.gerer',
  'actes.traiter',
  'confessions.voir_planning',
  'tableau_bord.voir',
].map((capacite) => ({
  capacite,
  node_id: ids.saintDominique,
  node_name: 'Saint-Dominique',
  node_type: 'paroisse',
  herite: true,
  office: 'secretaire_paroissial',
}));

export const grantsChancelier: Grant[] = ['structure.gerer', 'offices.nommer', 'personnes.verifier', 'tableau_bord.voir'].map(
  (capacite) => ({
    capacite,
    node_id: ids.dakar,
    node_name: 'Archidiocèse de Dakar',
    node_type: 'diocese',
    herite: true,
    office: 'chancelier',
  }),
);

export const grantsPlateforme: Grant[] = ['plateforme.admin', 'structure.gerer', 'audit.voir', 'tableau_bord.voir'].map((capacite) => ({
  capacite,
  node_id: null,
  node_name: 'Plateforme',
  node_type: 'plateforme',
  herite: true,
  office: 'plateforme',
}));

export const mockState: { grants: Grant[] } = { grants: [] };

export const me = {
  id: '5f0c0000-0000-4000-8000-0000000000aa',
  email: 'marie-therese.diouf@example.sn',
  profile: { first_name: 'Marie-Thérèse', last_name: 'Diouf' },
  etat_de_vie: 'laic',
  degre_ordre: 'aucun',
  statut_verification: 'declare',
  incardination: null,
  institut: null,
  paroisse_suivie: { id: ids.saintDominique, name: 'Saint-Dominique', code: 'SD', type: 'paroisse' },
  consent: { current_version: '2026-09', given_version: '2026-09', given_at: '2026-09-21T10:14:00+00:00', required: false },
};

export const liturgyToday = {
  date: '2026-09-24',
  calendar: {
    date: '2026-09-24',
    liturgical_year: 2026,
    season: 'ordinaire',
    season_label: 'Temps ordinaire',
    week: 25,
    celebration: 'Jeudi de la 25e semaine du temps ordinaire',
    rank: 'ferie',
    color: 'vert',
    sunday_cycle: 'A',
    weekday_cycle: 'II',
  },
  source: 'aelf',
  edition: null,
  notice: '',
  readings_available: true,
  readings: [
    { type: 'lecture_1', citation: 'Ec 1, 2-11', text: null, verses: [] },
    { type: 'psaume', citation: 'Ps 89 (90)', text: null, verses: [] },
    { type: 'evangile', citation: 'Lc 9, 7-9', text: null, verses: [] },
  ],
  audio_url: null,
  meditation: null,
};

export const parishes = [
  { id: ids.saintDominique, name: 'Saint-Dominique', code: 'SD', city: 'Dakar', address: 'Point E', is_active_on_platform: true },
  { id: 'b1000000-0000-4000-8000-000000000010', name: 'Cathédrale Notre-Dame-des-Victoires', code: 'CAT', city: 'Dakar', address: 'Plateau', is_active_on_platform: false },
  { id: 'b1000000-0000-4000-8000-000000000011', name: 'Sainte-Thérèse de Grand-Dakar', code: 'STG', city: 'Dakar', address: 'Grand-Dakar', is_active_on_platform: false },
];

export const onboardingState: { paroisse: string | null; consent: string | null; annonces: boolean | null } = {
  paroisse: null,
  consent: null,
  annonces: null,
};
