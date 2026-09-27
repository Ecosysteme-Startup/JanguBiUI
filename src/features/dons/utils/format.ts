import type { BadgeTone } from '@/components/ui/badge';

import type { DonationStatus, FundKind, PaymentMethod } from '../types/schemas';

const NNBSP = ' ';
const NBSP = ' ';
const numberFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/** « 5 000 » : espace fine insécable entre les milliers (chiffres tabulaires via `tabular-nums`). */
export const amount = (value: number): string => numberFormat.format(value).replace(/[\s\u00a0\u202f]/g, NNBSP);

/** « 5 000 FCFA » (insécable avant la devise : jamais de retour à la ligne entre les deux). */
export const fcfa = (value: number): string => `${amount(value)}${NBSP}FCFA`;

/** Frais estimés : même calcul que le serveur (`fees_compute` : arrondi au franc supérieur). */
export const estimatedFee = (value: number, feeRateBp: number): number => Math.ceil((value * feeRateBp) / 10000);

/** Répartition affichée avant le paiement (H3 : frais couverts ou déduits du don). */
export const breakdown = (value: number, feeRateBp: number, feesCovered: boolean) => {
  const fee = estimatedFee(value, feeRateBp);
  return { fee, charged: feesCovered ? value + fee : value, allocated: feesCovered ? value : value - fee };
};

/** Pourcentage entier de l'objectif atteint (plafonné à 100). */
export const progressPercent = (raised: number, goal: number | null | undefined): number =>
  goal ? Math.min(100, Math.floor((raised * 100) / goal)) : 0;

export const FUND_KIND_LABEL: Record<FundKind, string> = {
  quete_dominicale: 'Quête dominicale',
  quete_imperee: 'Quête impérée',
  campagne: 'Campagne',
  contribution_annuelle: 'Contribution annuelle',
};

export const fundKindLabel = (kind: string): string => FUND_KIND_LABEL[kind as FundKind] ?? kind;

/** Statuts de paiement (WEB-Design-System, « Statuts de paiement »). */
export const DONATION_STATUS: Record<DonationStatus, { label: string; tone: BadgeTone }> = {
  initie: { label: 'Initié', tone: 'neutral' },
  en_attente: { label: 'En attente', tone: 'warn' },
  confirme: { label: 'Confirmé', tone: 'ok' },
  echoue: { label: 'Échoué', tone: 'err' },
  expire: { label: 'Expiré', tone: 'muted' },
  rembourse: { label: 'Remboursé', tone: 'muted' },
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  free_money: 'Free Money',
  carte: 'Carte bancaire',
  especes: 'Espèces',
  autre: 'Autre',
  inconnu: '—',
};

export const paymentMethodLabel = (method: string | undefined): string =>
  (method && PAYMENT_METHOD_LABEL[method as PaymentMethod]) || '—';

/** Moyens proposés sur la page de l'agrégateur (pilules texte, jamais de logos de marque). */
export const ACCEPTED_METHODS = ['Wave', 'Orange Money', 'Free Money', 'Carte bancaire'] as const;

/** Mention d'autorisation (H4) : le serveur fournit toujours un texte (celui de la paroisse ou un texte par défaut). */
export const authorizationLabel = (a: { text: string } | null | undefined): string | null => a?.text || null;
