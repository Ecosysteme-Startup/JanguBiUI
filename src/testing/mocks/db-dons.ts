import type { Grant } from '@/lib/capacites';
import { ids } from '@/testing/mocks/db';

/**
 * Données de démonstration « Dons et quêtes » (docs maquettes : ECRANS-DONS-WEB §2). Fidèle :
 * Marie-Thérèse Diouf ; paroisse : Mme Cécile Coly, économe de Saint-Dominique ; diocèse :
 * M. Albert Senghor, économe diocésain ; plateforme : prestataire « PayDunya · mode test ».
 */
export const donsIds = {
  quete: 'd0000000-0000-4000-8000-000000000001',
  brin: 'd0000000-0000-4000-8000-000000000002',
  toiture: 'd0000000-0000-4000-8000-000000000003',
  contribution: 'd0000000-0000-4000-8000-000000000004',
  missions: 'd0000000-0000-4000-8000-000000000005',
  careme: 'd0000000-0000-4000-8000-000000000006',
  brinDiocese: 'd0000000-0000-4000-8000-000000000007',
  /** Don confirmé du parcours (référence 4817-2093-6651, reçu SD-2026-00147). */
  donConfirme: 'e0000000-0000-4000-8000-000000000001',
  donEnAttente: 'e0000000-0000-4000-8000-000000000002',
};

export const AUTHORIZATION = {
  reference: 'ARCH-DAK-2026-041',
  date: '2026-06-01',
  text: 'Collecte autorisée par l’Archevêché de Dakar, décision du 1er juin 2026 (réf. ARCH-DAK-2026-041).',
};

const grant = (capacite: string, node_id: string, node_name: string, node_type: string, office: string, office_label: string): Grant => ({
  capacite,
  node_id,
  node_name,
  node_type,
  herite: true,
  office,
  office_label,
});

export const grantsEconome: Grant[] = ['dons.voir_fonds', 'dons.gerer_fonds', 'dons.saisir_quete', 'dons.voir_donateurs', 'dons.exporter', 'tableau_bord.voir'].map(
  (c) => grant(c, ids.saintDominique, 'Saint-Dominique', 'paroisse', 'econome_paroissial', 'Économe paroissiale'),
);
export const grantsSecretaireDons: Grant[] = ['dons.voir_fonds', 'dons.saisir_quete'].map((c) =>
  grant(c, ids.saintDominique, 'Saint-Dominique', 'paroisse', 'secretaire_paroissial', 'Secrétaire paroissiale'),
);
export const grantsEconomeDiocesain: Grant[] = ['dons.definir_quete_imperee', 'tableau_bord.voir'].map((c) =>
  grant(c, ids.dakar, 'Archidiocèse de Dakar', 'diocese', 'econome_diocesain', 'Économe diocésain'),
);

const parish = { id: ids.saintDominique, name: 'Saint-Dominique', city: 'Dakar' };

type FundRow = {
  id: string;
  kind: 'quete_dominicale' | 'quete_imperee' | 'campagne' | 'contribution_annuelle';
  title: string;
  raised: number;
  destination?: 'paroisse' | 'curie';
  description?: string;
  starts_on?: string | null;
  ends_on?: string | null;
  goal_amount?: number | null;
  status?: 'brouillon' | 'ouvert' | 'clos';
};

const fund = (f: FundRow) => ({
  destination: 'paroisse' as const,
  description: '',
  starts_on: null,
  ends_on: null,
  goal_amount: null,
  status: 'ouvert' as const,
  image_url: null as string | null,
  ...f,
});

export const publicFunds = () => [
  fund({ id: donsIds.quete, kind: 'quete_dominicale', title: 'Quête du dimanche 27 septembre', starts_on: '2026-09-26', ends_on: '2026-10-04', raised: 38_500 }),
  fund({
    id: donsIds.brin,
    kind: 'quete_imperee',
    destination: 'curie',
    title: 'Quête impérée pour le Grand Séminaire de Brin',
    description: 'Formation des futurs prêtres du diocèse.',
    starts_on: '2026-09-27',
    ends_on: '2026-10-04',
    raised: 674_525,
  }),
  fund({
    id: donsIds.toiture,
    kind: 'campagne',
    title: 'Toiture de la chapelle de la Cité universitaire',
    description:
      'Refaire la toiture de la chapelle avant la saison des pluies : charpente, tôles, gouttières et main-d’œuvre.',
    starts_on: '2026-06-01',
    ends_on: '2026-12-31',
    goal_amount: 4_500_000,
    raised: 1_186_400,
  }),
  fund({ id: donsIds.contribution, kind: 'contribution_annuelle', title: 'Contribution annuelle 2026', starts_on: '2026-01-01', ends_on: '2026-12-31', raised: 44_000 }),
];

export const publicParish = () => ({
  parish,
  enabled: true,
  authorization: AUTHORIZATION,
  suggested_amounts: [1000, 2000, 5000, 10000],
  min_amount: 100,
  max_amount: 1_000_000,
  fee_rate_bp: 200,
  funds: publicFunds(),
});

export const campaignDetail = () => ({
  ...publicFunds()[2],
  parish,
  updates: [
    {
      id: 2,
      body: 'Les tôles sont commandées : la livraison est prévue pour la mi-octobre. Merci à tous ceux qui ont déjà donné.',
      created_at: '2026-09-20T10:00:00+00:00',
      author_name: 'Abbé Augustin Ndiaye',
    },
    {
      id: 1,
      body: 'Le devis de la charpente est validé par le conseil économique. Les travaux commenceront dès l’objectif atteint.',
      created_at: '2026-07-12T10:00:00+00:00',
      author_name: 'Abbé Augustin Ndiaye',
    },
  ],
});

const brief = (id: string) => {
  const f = publicFunds().find((x) => x.id === id)!;
  return { id: f.id, title: f.title, kind: f.kind as string };
};

export const confirmedDonation = () => ({
  id: donsIds.donConfirme,
  reference: '4817-2093-6651',
  receipt_number: 'SD-2026-00147',
  status: 'confirme',
  fund: brief(donsIds.quete),
  parish: 'Saint-Dominique',
  amount: 5000,
  fees_covered: false,
  charged_amount: 5000,
  confirmed_at: '2026-09-24T09:14:00+00:00',
});

export const pendingDonation = () => ({
  ...confirmedDonation(),
  id: donsIds.donEnAttente,
  reference: '3302-7718-0459',
  receipt_number: null,
  status: 'en_attente',
  confirmed_at: null,
});

const mine = (
  n: number,
  fundId: string,
  amountValue: number,
  status: string,
  method: string,
  date: string,
  extra: Record<string, unknown> = {},
) => ({
  id: `e1000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  reference: `4817-2093-${String(6600 + n).padStart(4, '0')}`,
  receipt_number: status === 'confirme' ? `SD-2026-${String(100 + n).padStart(5, '0')}` : null,
  fund: brief(fundId),
  parish: 'Saint-Dominique',
  amount: amountValue,
  fee_amount: Math.ceil(amountValue * 0.02),
  fees_covered: false,
  charged_amount: amountValue,
  status,
  channel: 'en_ligne',
  payment_method: method,
  anonymous: false,
  created_at: `${date}T09:00:00+00:00`,
  confirmed_at: status === 'confirme' ? `${date}T09:01:00+00:00` : null,
  receipt_available: status === 'confirme',
  ...extra,
});

/** Mes dons 2026 : 38 500 FCFA confirmés, 7 dons (WEB-FID-Mes-Dons). */
export const myDonations = () => [
  { ...mine(47, donsIds.quete, 5000, 'confirme', 'wave', '2026-09-24'), id: donsIds.donConfirme, reference: '4817-2093-6651', receipt_number: 'SD-2026-00147' },
  mine(46, donsIds.toiture, 10000, 'en_attente', 'orange_money', '2026-09-20'),
  mine(45, donsIds.quete, 1500, 'confirme', 'wave', '2026-09-20'),
  mine(44, donsIds.toiture, 25000, 'confirme', 'carte', '2026-08-15', { anonymous: true }),
  mine(43, donsIds.quete, 2000, 'echoue', 'free_money', '2026-07-05'),
  mine(42, donsIds.contribution, 2000, 'confirme', 'wave', '2026-03-01'),
  mine(41, donsIds.quete, 5000, 'confirme', 'orange_money', '2026-02-08'),
];

export const donorSummary = (year: number) => ({
  year,
  total: year === 2026 ? 38_500 : 0,
  count: year === 2026 ? 7 : 0,
  by_fund:
    year === 2026
      ? [
          { fund_id: donsIds.toiture, title: 'Toiture de la chapelle de la Cité universitaire', parish: 'Saint-Dominique', total: 25_000, count: 1 },
          { fund_id: donsIds.quete, title: 'Quête du dimanche 27 septembre', parish: 'Saint-Dominique', total: 11_500, count: 3 },
          { fund_id: donsIds.contribution, title: 'Contribution annuelle 2026', parish: 'Saint-Dominique', total: 2000, count: 1 },
        ]
      : [],
});

// --- Paroisse ------------------------------------------------------------------------------

export const staffFunds = () =>
  publicFunds().map((f) => ({
    ...f,
    node_id: f.kind === 'quete_imperee' ? ids.dakar : ids.saintDominique,
    parent_id: f.kind === 'quete_imperee' ? donsIds.brinDiocese : null,
    donations_count: f.kind === 'campagne' ? 57 : f.kind === 'quete_imperee' ? 5 : 12,
    decided_by_office: f.kind === 'quete_imperee' ? 'eveque_diocesain' : 'cure',
    authorization_ref: f.kind === 'campagne' ? 'ARCH-DAK-2026-041' : '',
    published_at: `${f.starts_on}T08:00:00+00:00`,
    closed_at: null,
    created_at: `${f.starts_on}T08:00:00+00:00`,
  }));

/** Synthèse de septembre 2026 : 1 214 830 affectés, dont 356 330 en ligne et 858 500 en espèces. */
export const parishSummary = () => ({
  month: '2026-09-01',
  total: 1_214_830,
  online: 356_330,
  cash: 858_500,
  fees: 7120,
  count: 47,
  pending_count: 3,
  cash_to_validate: 1,
  by_fund: [
    { fund_id: donsIds.brin, title: 'Quête impérée pour le Grand Séminaire de Brin', kind: 'quete_imperee', total: 674_525, count: 5 },
    { fund_id: donsIds.toiture, title: 'Toiture de la chapelle de la Cité universitaire', kind: 'campagne', total: 236_400, count: 21 },
    { fund_id: 'd0000000-0000-4000-8000-000000000010', title: 'Quêtes des dimanches 6, 13 et 20 septembre', kind: 'quete_dominicale', total: 221_405, count: 12 },
    { fund_id: donsIds.contribution, title: 'Contribution annuelle 2026', kind: 'contribution_annuelle', total: 44_000, count: 6 },
    { fund_id: donsIds.quete, title: 'Quête du dimanche 27 septembre', kind: 'quete_dominicale', total: 38_500, count: 8 },
  ],
  by_method: [
    { method: 'especes', total: 858_500, count: 9 },
    { method: 'wave', total: 201_450, count: 27 },
    { method: 'orange_money', total: 98_880, count: 13 },
    { method: 'carte', total: 56_000, count: 7 },
  ],
  daily: [
    { date: '2026-09-06', total: 212_300 },
    { date: '2026-09-13', total: 198_750 },
    { date: '2026-09-20', total: 186_255 },
    { date: '2026-09-27', total: 617_525 },
  ],
});

const op = (n: number, fundId: string, value: number, method: string, status: string, donor: string, date: string) => ({
  id: `e2000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  reference: method === 'especes' ? `Q-2026-0927-${n}` : `${5100 + n}-${2000 + n * 7}-${6000 + n * 13}`.slice(0, 14),
  receipt_number: status === 'confirme' && method !== 'especes' ? `SD-2026-${String(140 + n).padStart(5, '0')}` : null,
  fund: brief(fundId),
  amount: value,
  fee_amount: method === 'especes' ? 0 : Math.ceil(value * 0.02),
  charged_amount: value,
  net_amount: method === 'especes' ? value : value - Math.ceil(value * 0.02),
  channel: method === 'especes' ? 'especes' : 'en_ligne',
  payment_method: method,
  status,
  created_at: date,
  confirmed_at: status === 'confirme' ? date : null,
  donor,
});

export const operations = () => [
  op(1, donsIds.brin, 118_400, 'especes', 'confirme', 'Quête en espèces', '2026-09-27T19:30:00+00:00'),
  op(2, donsIds.toiture, 10_000, 'wave', 'confirme', 'Élisabeth Gomis', '2026-09-27T16:12:00+00:00'),
  op(3, donsIds.brin, 231_900, 'especes', 'confirme', 'Quête en espèces', '2026-09-27T13:05:00+00:00'),
  op(4, donsIds.quete, 5000, 'orange_money', 'en_attente', 'Donateur sans compte', '2026-09-27T12:40:00+00:00'),
  op(5, donsIds.quete, 2000, 'wave', 'confirme', 'Anonyme', '2026-09-27T11:02:00+00:00'),
  op(6, donsIds.brin, 96_725, 'especes', 'confirme', 'Quête en espèces', '2026-09-27T11:00:00+00:00'),
  op(7, donsIds.toiture, 25_000, 'carte', 'confirme', 'Paul Sagna', '2026-09-26T21:18:00+00:00'),
  op(8, donsIds.brin, 142_350, 'especes', 'confirme', 'Quête en espèces', '2026-09-27T08:45:00+00:00'),
  op(9, donsIds.contribution, 5000, 'wave', 'echoue', 'Anonyme', '2026-09-26T19:44:00+00:00'),
  op(10, donsIds.brin, 64_150, 'especes', 'confirme', 'Quête en espèces', '2026-09-26T20:10:00+00:00'),
];

const cash = (id: number, label: string, date: string, value: number, one: string, two: string, status: string, enteredBy: string, extra: Record<string, unknown> = {}) => ({
  id,
  fund: brief(donsIds.brin),
  place: 'Église Saint-Dominique',
  mass_date: date,
  mass_label: label,
  amount: value,
  counter_one: one,
  counter_two: two,
  observation: '',
  status,
  entered_by: enteredBy,
  validated_by: status === 'validee' ? 'Cécile Coly' : null,
  validated_at: status === 'validee' ? `${date}T20:00:00+00:00` : null,
  rejection_reason: '',
  created_at: `${date}T19:00:00+00:00`,
  ...extra,
});

/** Quêtes du week-end du 27 (affectées à la quête impérée de Brin). */
export const cashCollections = () => [
  cash(5, 'Messe de 18 h 30', '2026-09-27', 118_400, 'Pierre Ndour', 'Thérèse Ndione', 'saisie', 'Germaine Faye'),
  cash(4, 'Messe de 11 h 30', '2026-09-27', 231_900, 'Joseph Mendy', 'Cécile Coly', 'validee', 'Germaine Faye'),
  cash(3, 'Messe de 9 h 30 (étudiants)', '2026-09-27', 96_725, 'Pierre Ndour', 'Thérèse Ndione', 'validee', 'Cécile Coly'),
  cash(2, 'Messe de 7 h 30', '2026-09-27', 142_350, 'Joseph Mendy', 'Cécile Coly', 'validee', 'Germaine Faye'),
  cash(1, 'Messe anticipée de 18 h 30', '2026-09-26', 64_150, 'Pierre Ndour', 'Thérèse Ndione', 'rejetee', 'Germaine Faye', {
    rejection_reason: 'Second compteur absent : recompter lundi.',
  }),
];

export const reconciliation = () => ({
  date_from: '2026-09-01',
  date_to: '2026-09-30',
  online_charged: 356_330,
  online_fees: 7120,
  online_net: 349_210,
  cash: 858_500,
  paid_out: 301_480,
  awaiting_payout: 47_730,
  issues: [
    { kind: 'paiement_en_attente', reference: '3302-7718-0459', date: '2026-09-27' },
    { kind: 'quete_non_validee', reference: 'Q-2026-0920-3', date: '2026-09-20' },
    { kind: 'reversement_ecart', reference: 'PO-2026-0914', date: '2026-09-14' },
  ],
});

export const payouts = () => [
  { id: 3, provider: 'paydunya', external_ref: 'PO-2026-0925', paid_at: '2026-09-25T06:00:00+00:00', gross_amount: 158_000, fee_amount: 3160, net_amount: 154_840, status: 'rapproche', discrepancy_amount: 0, unmatched_count: 0, reconciled_at: '2026-09-25T07:00:00+00:00' },
  { id: 2, provider: 'paydunya', external_ref: 'PO-2026-0914', paid_at: '2026-09-14T06:00:00+00:00', gross_amount: 102_000, fee_amount: 2040, net_amount: 97_020, status: 'ecart', discrepancy_amount: 2940, unmatched_count: 1, reconciled_at: null },
  { id: 1, provider: 'paydunya', external_ref: 'PO-2026-0905', paid_at: '2026-09-05T06:00:00+00:00', gross_amount: 50_632, fee_amount: 1012, net_amount: 49_620, status: 'rapproche', discrepancy_amount: 0, unmatched_count: 0, reconciled_at: '2026-09-05T07:00:00+00:00' },
];

// --- Diocèse et plateforme -----------------------------------------------------------------

export const imperees = () => [
  { id: donsIds.brinDiocese, title: 'Quête impérée pour le Grand Séminaire de Brin', description: 'Formation des futurs prêtres du diocèse.', starts_on: '2026-09-27', ends_on: '2026-10-04', status: 'ouvert', authorization_ref: 'ARCH-DAK-2026-052', decided_by_office: 'eveque_diocesain', raised: 674_525, parishes_count: 1, created_at: '2026-09-10T09:00:00+00:00' },
  { id: donsIds.missions, title: 'Journée mondiale des Missions', description: 'Œuvres pontificales missionnaires.', starts_on: '2026-10-18', ends_on: '2026-10-25', status: 'brouillon', authorization_ref: 'ARCH-DAK-2026-060', decided_by_office: 'eveque_diocesain', raised: 0, parishes_count: 1, created_at: '2026-09-20T09:00:00+00:00' },
  { id: donsIds.careme, title: 'Carême de partage 2026', description: 'Solidarité diocésaine.', starts_on: '2026-03-29', ends_on: '2026-04-05', status: 'clos', authorization_ref: 'ARCH-DAK-2026-011', decided_by_office: 'eveque_diocesain', raised: 0, parishes_count: 1, created_at: '2026-03-01T09:00:00+00:00' },
];

export const impereeFollow = (fundId: string) => [
  { fund_id: fundId, parish_id: ids.saintDominique, parish: 'Saint-Dominique', status: 'ouvert', online: 21_000, cash: 653_525, count: 10, total: 674_525 },
  ...['Cathédrale Notre-Dame-des-Victoires', 'Sainte-Thérèse de Grand-Dakar', 'Saint-Joseph de Medina', 'Sacré-Cœur'].map((name, i) => ({
    fund_id: fundId,
    parish_id: `b1000000-0000-4000-8000-0000000000${20 + i}`,
    parish: name,
    status: 'non_ouverte',
    online: 0,
    cash: 0,
    count: 0,
    total: 0,
  })),
];

export const health = () => ({
  provider: 'PayDunya · mode test',
  webhooks_24h: 62,
  webhooks_failed_24h: 2,
  webhooks_7d_by_status: { traite: 388, doublon: 9, rejete: 3, erreur: 2 },
  last_webhook_at: '2026-09-28T08:56:00+00:00',
  pending_payments: 3,
  oldest_pending_at: '2026-09-27T07:00:00+00:00',
  payouts_with_discrepancy: 1,
  payouts_to_reconcile: 1,
  incidents: [
    { at: '2026-09-28T07:42:00+00:00', provider: 'paydunya', status: 'rejete', error: 'invalid_signature' },
    { at: '2026-09-27T18:05:00+00:00', provider: 'paydunya', status: 'erreur', error: 'amount_mismatch' },
    { at: '2026-09-27T11:20:00+00:00', provider: 'paydunya', status: 'traite', error: 'late_payment' },
    { at: '2026-09-26T22:14:00+00:00', provider: 'paydunya', status: 'erreur', error: 'provider_unavailable' },
  ],
});

export const activations = () => [
  {
    node: parish,
    enabled: true,
    authorization_ref: 'ARCH-DAK-2026-041',
    authorization_date: '2026-06-01',
    authorization_text: AUTHORIZATION.text,
    allocation_key: 'SD01',
    receipt_prefix: 'SD',
    updated_at: '2026-06-01T10:00:00+00:00',
  },
];

/** État mutable des handlers (réinitialisé par `resetDonsState`). */
export const donsState = {
  checkouts: [] as { body: unknown; idempotencyKey: string | null }[],
  statusSequence: [] as string[],
  cashCreated: [] as unknown[],
  validated: [] as number[],
  exports: [] as string[],
};

export const resetDonsState = () => {
  donsState.checkouts = [];
  donsState.statusSequence = [];
  donsState.cashCreated = [];
  donsState.validated = [];
  donsState.exports = [];
};
