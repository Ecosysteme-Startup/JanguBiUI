import { z } from 'zod';

import type { Expect, Matches, ResponseBody } from '@/types/api-contract';

/**
 * Schémas des réponses de l'API dons (apps/donations, ADR-017). Ils valident à l'exécution ;
 * les gardes `Expect<Matches<…>>` en bas de fichier vérifient à la compilation qu'ils décrivent
 * bien le contrat du serveur (`schema.yml`).
 */

export const FUND_KINDS = ['quete_dominicale', 'quete_imperee', 'campagne', 'contribution_annuelle'] as const;
export type FundKind = (typeof FUND_KINDS)[number];
export const FUND_STATUSES = ['brouillon', 'ouvert', 'clos'] as const;
export type FundStatus = (typeof FUND_STATUSES)[number];
export const DONATION_STATUSES = ['initie', 'en_attente', 'confirme', 'echoue', 'expire', 'rembourse'] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];
export const PAYMENT_METHODS = ['wave', 'orange_money', 'free_money', 'carte', 'especes', 'autre', 'inconnu'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const kind = z.enum(FUND_KINDS);
const fundStatus = z.enum(FUND_STATUSES);
const donationStatus = z.enum(DONATION_STATUSES);
const method = z.enum(PAYMENT_METHODS);
const channel = z.enum(['en_ligne', 'especes']);

export const nodeBriefSchema = z.object({ id: z.string(), name: z.string(), city: z.string() });
/** Lieu de célébration (église, chapelle) rattaché à une collecte ou à une opération. */
export const donationPlaceSchema = z.object({ id: z.number(), name: z.string() });
export type DonationPlace = z.infer<typeof donationPlaceSchema>;

export const DONATION_SOURCES = ['app_ios', 'app_android', 'web', 'qr', 'inconnu'] as const;
export type DonationSource = (typeof DONATION_SOURCES)[number];

export const fundBriefSchema = z.object({ id: z.string(), title: z.string(), kind: z.string() });

export const authorizationSchema = z.object({ reference: z.string(), date: z.string().nullable(), text: z.string() });
export type Authorization = z.infer<typeof authorizationSchema>;

export const publicFundSchema = z.object({
  id: z.string(),
  kind,
  destination: z.enum(['paroisse', 'curie']).optional(),
  title: z.string(),
  description: z.string().optional(),
  starts_on: z.string().nullable().optional(),
  ends_on: z.string().nullable().optional(),
  goal_amount: z.number().nullable().optional(),
  raised: z.number(),
  status: fundStatus.optional(),
  image_url: z.string().nullable(),
  place: donationPlaceSchema.nullable(),
  /** La messe anticipée du samedi soir compte dans la collecte du dimanche. */
  messe_anticipee_incluse: z.boolean().optional(),
});
export type PublicFund = z.infer<typeof publicFundSchema>;

export const fundNewsSchema = z.object({ id: z.number(), body: z.string(), created_at: z.string().optional(), author_name: z.string() });
export type FundNews = z.infer<typeof fundNewsSchema>;

export const publicFundDetailSchema = publicFundSchema.extend({
  parish: nodeBriefSchema,
  updates: z.array(fundNewsSchema),
});
export type PublicFundDetail = z.infer<typeof publicFundDetailSchema>;

export const publicParishSchema = z.object({
  parish: nodeBriefSchema,
  enabled: z.boolean(),
  authorization: authorizationSchema.nullable(),
  suggested_amounts: z.array(z.number()),
  min_amount: z.number(),
  max_amount: z.number(),
  /** Frais estimés en points de base (200 = 2 %). */
  fee_rate_bp: z.number(),
  funds: z.array(publicFundSchema),
});
export type PublicParish = z.infer<typeof publicParishSchema>;

export const checkoutSchema = z.object({
  donation_id: z.string(),
  reference: z.string(),
  status: z.string(),
  checkout_url: z.string(),
  amount: z.number(),
  fee_amount: z.number(),
  charged_amount: z.number(),
  net_amount: z.number(),
});
export type Checkout = z.infer<typeof checkoutSchema>;

export const donationStatusSchema = z.object({
  id: z.string(),
  reference: z.string(),
  receipt_number: z.string().nullable().optional(),
  status: donationStatus.optional(),
  fund: fundBriefSchema,
  parish: z.string(),
  amount: z.number(),
  fees_covered: z.boolean().optional(),
  charged_amount: z.number(),
  confirmed_at: z.string().nullable().optional(),
});
export type DonationState = z.infer<typeof donationStatusSchema>;

export const myDonationSchema = z.object({
  id: z.string(),
  reference: z.string(),
  receipt_number: z.string().nullable().optional(),
  fund: fundBriefSchema,
  parish: z.string(),
  amount: z.number(),
  fee_amount: z.number().optional(),
  fees_covered: z.boolean().optional(),
  charged_amount: z.number(),
  status: donationStatus.optional(),
  channel: channel.optional(),
  payment_method: method.optional(),
  anonymous: z.boolean().optional(),
  created_at: z.string().optional(),
  confirmed_at: z.string().nullable().optional(),
  receipt_available: z.boolean(),
});
export type MyDonation = z.infer<typeof myDonationSchema>;

const page = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ limit: z.number(), offset: z.number(), count: z.number(), next: z.string().nullable(), previous: z.string().nullable(), results: z.array(item) });

export const myDonationPageSchema = page(myDonationSchema);
export type MyDonationPage = z.infer<typeof myDonationPageSchema>;

export const donorSummarySchema = z.object({
  year: z.number(),
  total: z.number(),
  count: z.number(),
  by_fund: z.array(z.object({ fund_id: z.string(), title: z.string(), parish: z.string(), total: z.number(), count: z.number() })),
});
export type DonorSummary = z.infer<typeof donorSummarySchema>;

// --- Back-office paroisse ------------------------------------------------------------------

export const staffFundSchema = publicFundSchema.extend({
  node_id: z.string(),
  parent_id: z.string().nullable(),
  donations_count: z.number(),
  decided_by_office: z.string().optional(),
  authorization_ref: z.string().optional(),
  published_at: z.string().nullable().optional(),
  closed_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
});
export type StaffFund = z.infer<typeof staffFundSchema>;

export const parishSummarySchema = z.object({
  month: z.string(),
  total: z.number(),
  online: z.number(),
  cash: z.number(),
  fees: z.number(),
  /** Obsolète côté serveur : dons en ligne + quêtes. Préférer `online_count` et `cash_collections_count`. */
  count: z.number(),
  online_count: z.number(),
  cash_collections_count: z.number(),
  pending_count: z.number(),
  pending_oldest_at: z.string().nullable(),
  cash_to_validate: z.number(),
  closed: z.boolean(),
  closed_at: z.string().nullable(),
  by_destination: z.object({ paroisse: z.number(), curie: z.number() }),
  by_fund: z.array(
    z.object({ fund_id: z.string(), title: z.string(), kind: z.string(), destination: z.string(), total: z.number(), count: z.number() }),
  ),
  by_method: z.array(z.object({ method: z.string(), total: z.number(), count: z.number() })),
  daily: z.array(z.object({ date: z.string(), online: z.number(), cash: z.number(), total: z.number() })),
});
export type ParishSummary = z.infer<typeof parishSummarySchema>;

export const operationSchema = z.object({
  id: z.string(),
  reference: z.string(),
  receipt_number: z.string().nullable().optional(),
  fund: fundBriefSchema,
  amount: z.number(),
  fee_amount: z.number().optional(),
  fee_is_actual: z.boolean().optional(),
  charged_amount: z.number(),
  net_amount: z.number(),
  channel: channel.optional(),
  source: z.union([z.enum(DONATION_SOURCES), z.literal('')]).nullable().optional(),
  payment_method: method.optional(),
  place: donationPlaceSchema.nullable(),
  status: donationStatus.optional(),
  created_at: z.string().optional(),
  confirmed_at: z.string().nullable().optional(),
  value_date: z.string().nullable().optional(),
  anonymous: z.boolean().optional(),
  /** Nom, « Anonyme », « Donateur sans compte », « Quête en espèces » ou « Donateur » (sans dons.voir_donateurs). */
  donor: z.string(),
});
export type Operation = z.infer<typeof operationSchema>;
export const operationPageSchema = page(operationSchema);
export type OperationPage = z.infer<typeof operationPageSchema>;

export const cashCollectionSchema = z.object({
  id: z.number(),
  fund: fundBriefSchema,
  place: z.string().nullable().optional(),
  mass_date: z.string(),
  mass_label: z.string(),
  amount: z.number(),
  counter_one: z.string(),
  counter_two: z.string(),
  observation: z.string().optional(),
  status: z.enum(['saisie', 'validee', 'rejetee']).optional(),
  entered_by: z.string(),
  /** Identifiant de la personne qui a saisi (quand le backend le fournit) : sert à masquer « Valider » à l'auteur. */
  entered_by_id: z.string().nullish(),
  validated_by: z.string().nullable(),
  validated_at: z.string().nullable().optional(),
  rejection_reason: z.string().optional(),
  created_at: z.string().optional(),
  deposit_id: z.number().nullable(),
});
export type CashCollection = z.infer<typeof cashCollectionSchema>;
export const cashCollectionPageSchema = page(cashCollectionSchema);
export type CashCollectionPage = z.infer<typeof cashCollectionPageSchema>;

export const reconciliationSchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
  online_charged: z.number(),
  online_fees: z.number(),
  online_net: z.number(),
  cash: z.number(),
  paid_out: z.number(),
  awaiting_payout: z.number(),
  issues: z.array(
    z.object({ kind: z.enum(['paiement_en_attente', 'quete_non_validee', 'reversement_ecart']), reference: z.string(), date: z.string() }),
  ),
});
export type Reconciliation = z.infer<typeof reconciliationSchema>;

export const payoutSchema = z.object({
  id: z.number(),
  provider: z.string(),
  external_ref: z.string(),
  paid_at: z.string(),
  gross_amount: z.number(),
  fee_amount: z.number().optional(),
  net_amount: z.number(),
  status: z.enum(['recu', 'rapproche', 'ecart']).optional(),
  discrepancy_amount: z.number().optional(),
  unmatched_count: z.number().optional(),
  reconciled_at: z.string().nullable().optional(),
});
export type Payout = z.infer<typeof payoutSchema>;
export const payoutPageSchema = page(payoutSchema);
export type PayoutPage = z.infer<typeof payoutPageSchema>;

// --- Diocèse et plateforme -----------------------------------------------------------------

export const impereeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  starts_on: z.string().nullable().optional(),
  ends_on: z.string().nullable().optional(),
  status: fundStatus.optional(),
  authorization_ref: z.string().optional(),
  remit_by: z.string().nullable().optional(),
  messe_anticipee_incluse: z.boolean().optional(),
  decided_by_office: z.string().optional(),
  raised: z.number(),
  parishes_count: z.number(),
  created_at: z.string().optional(),
});
export type Imperee = z.infer<typeof impereeSchema>;

export const impereeFollowRowSchema = z.object({
  fund_id: z.string(),
  parish_id: z.string(),
  parish: z.string(),
  status: z.string(),
  online: z.number(),
  cash: z.number(),
  count: z.number(),
  total: z.number(),
});
export type ImpereeFollowRow = z.infer<typeof impereeFollowRowSchema>;

export const healthSchema = z.object({
  provider: z.string(),
  webhooks_24h: z.number(),
  webhooks_failed_24h: z.number(),
  webhooks_7d_by_status: z.record(z.string(), z.number()),
  last_webhook_at: z.string().nullable(),
  pending_payments: z.number(),
  oldest_pending_at: z.string().nullable(),
  payouts_with_discrepancy: z.number(),
  payouts_to_reconcile: z.number(),
  incidents: z.array(z.object({ at: z.string(), provider: z.string(), status: z.string(), error: z.string() })),
});
export type Health = z.infer<typeof healthSchema>;

export const activationSchema = z.object({
  node: nodeBriefSchema,
  enabled: z.boolean().optional(),
  authorization_ref: z.string().optional(),
  authorization_date: z.string().nullable().optional(),
  authorization_text: z.string().optional(),
  allocation_key: z.string().optional(),
  receipt_prefix: z.string().optional(),
  updated_at: z.string(),
});
export type Activation = z.infer<typeof activationSchema>;

// Gardes de compilation : un champ renommé côté serveur casse le build (voir api-contract.ts).
type _PublicParish = Expect<Matches<PublicParish, ResponseBody<'public_dons_parish'>>>;
type _FundDetail = Expect<Matches<PublicFundDetail, ResponseBody<'public_dons_fund'>>>;
type _Checkout = Expect<Matches<Checkout, ResponseBody<'dons_checkout_create'>>>;
type _State = Expect<Matches<DonationState, ResponseBody<'dons_checkout_status'>>>;
type _Mine = Expect<Matches<MyDonationPage, ResponseBody<'me_dons_list'>>>;
type _Summary = Expect<Matches<DonorSummary, ResponseBody<'me_dons_summary'>>>;
type _StaffFund = Expect<Matches<StaffFund, ResponseBody<'staff_dons_funds_detail'>>>;
type _ParishSummary = Expect<Matches<ParishSummary, ResponseBody<'staff_dons_summary'>>>;
type _Operations = Expect<Matches<OperationPage, ResponseBody<'staff_dons_operations'>>>;
type _Cash = Expect<Matches<CashCollectionPage, ResponseBody<'staff_dons_cash_list'>>>;
type _Reco = Expect<Matches<Reconciliation, ResponseBody<'staff_dons_reconciliation'>>>;
type _Payouts = Expect<Matches<PayoutPage, ResponseBody<'staff_dons_payouts'>>>;
type _Health = Expect<Matches<Health, ResponseBody<'platform_dons_health'>>>;
export type DonsContractGuards = [
  _PublicParish, _FundDetail, _Checkout, _State, _Mine, _Summary, _StaffFund, _ParishSummary, _Operations, _Cash, _Reco, _Payouts, _Health,
];
