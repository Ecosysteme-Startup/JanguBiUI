import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api, saveBlob } from '@/lib/api-client';
import { paginatedSchema } from '@/lib/pagination';

// Dons du fidèle — backend apps/donations (ADR-017), routes V1 :
//   GET  /v1/public/dons/paroisses/<node_id>/  page de don d'une paroisse
//   GET  /v1/public/dons/fonds/<fund_id>/      détail d'un fonds / campagne
//   POST /v1/dons/checkout/                    prépare le don → checkout_url
//   GET  /v1/dons/checkout/<donation_id>/      statut au retour du paiement
//   GET  /v1/me/dons/?fund=&year=&limit=&offset=  mes dons (paginé)
//   GET  /v1/me/dons/resume/?year=             total de l'année (moi seul)
//   GET  /v1/me/dons/<donation_id>/recu/       reçu PDF (don confirmé)
// Le moyen de paiement (Wave, Orange Money, carte…) se choisit sur la page
// de l'agrégateur, jamais dans Jàngu Bi. Pas d'offrande de messe ici.

export const FUND_KIND_LABELS: Record<string, string> = {
  quete_dominicale: 'Quête dominicale',
  quete_imperee: 'Quête impérée',
  campagne: 'Campagne pour un projet',
  contribution_annuelle: 'Contribution annuelle',
};

export const DONATION_STATUS_LABELS: Record<string, string> = {
  initie: 'Initié',
  en_attente: 'En attente de confirmation',
  confirme: 'Confirmé',
  echoue: 'Non abouti',
  expire: 'Expiré',
  rembourse: 'Remboursé',
};

const nodeBriefSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string().default(''),
});

export const publicFundSchema = z.object({
  id: z.string(),
  kind: z.string(),
  destination: z.string().default('paroisse'),
  title: z.string(),
  description: z.string().default(''),
  starts_on: z.string().nullable().default(null),
  ends_on: z.string().nullable().default(null),
  goal_amount: z.number().nullable().default(null),
  raised: z.number().default(0),
  status: z.string(),
  image_url: z.string().nullable().default(null),
  place: z
    .object({ id: z.number(), name: z.string() })
    .nullable()
    .default(null),
  messe_anticipee_incluse: z.boolean().default(false),
});
export type PublicFund = z.infer<typeof publicFundSchema>;

export const pageDonSchema = z.object({
  parish: nodeBriefSchema,
  enabled: z.boolean(),
  authorization: z
    .object({
      reference: z.string(),
      date: z.string().nullable(),
      text: z.string(),
    })
    .nullable(),
  suggested_amounts: z.array(z.number()),
  min_amount: z.number(),
  max_amount: z.number(),
  fee_rate_bp: z.number(),
  funds: z.array(publicFundSchema),
});
export type PageDon = z.infer<typeof pageDonSchema>;

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

const fundBriefSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.string(),
});

export const donationStatusSchema = z.object({
  id: z.string(),
  reference: z.string(),
  receipt_number: z.string().nullable().default(null),
  status: z.string(),
  fund: fundBriefSchema,
  parish: z.string(),
  amount: z.number(),
  fees_covered: z.boolean(),
  charged_amount: z.number(),
  confirmed_at: z.string().nullable(),
});
export type DonationStatus = z.infer<typeof donationStatusSchema>;

export const myDonationSchema = z.object({
  id: z.string(),
  reference: z.string(),
  receipt_number: z.string().nullable().default(null),
  fund: fundBriefSchema,
  parish: z.string(),
  amount: z.number(),
  fee_amount: z.number().default(0),
  fees_covered: z.boolean().default(false),
  charged_amount: z.number(),
  status: z.string(),
  channel: z.string(),
  payment_method: z.string().nullable().default(null),
  anonymous: z.boolean().default(false),
  created_at: z.string(),
  confirmed_at: z.string().nullable(),
  receipt_available: z.boolean(),
});
export type MyDonation = z.infer<typeof myDonationSchema>;

export const donorSummarySchema = z.object({
  year: z.number(),
  total: z.number(),
  count: z.number(),
  by_fund: z.array(
    z.object({
      fund_id: z.string(),
      title: z.string(),
      parish: z.string(),
      total: z.number(),
      count: z.number(),
    }),
  ),
});
export type DonorSummary = z.infer<typeof donorSummarySchema>;

// --------------------------------------------------------------- lecture

export const getPageDon = async (nodeId: string): Promise<PageDon> =>
  pageDonSchema.parse(
    await api.get<unknown>(
      `/v1/public/dons/paroisses/${encodeURIComponent(nodeId)}/`,
      { quiet: true },
    ),
  );

export const usePageDon = (nodeId: string | null) =>
  useQuery(
    queryOptions({
      queryKey: ['dons', 'paroisse', nodeId],
      queryFn: () => getPageDon(nodeId as string),
      enabled: !!nodeId,
      retry: false,
    }),
  );

export const getCheckoutStatus = async (
  donationId: string,
): Promise<DonationStatus> =>
  donationStatusSchema.parse(
    await api.get<unknown>(
      `/v1/dons/checkout/${encodeURIComponent(donationId)}/`,
      { quiet: true },
    ),
  );

const EN_COURS = ['initie', 'en_attente'];

/** Statut au retour : relu tant que l'agrégateur n'a pas confirmé. */
export const useCheckoutStatus = (donationId: string | null) =>
  useQuery({
    queryKey: ['dons', 'checkout', donationId],
    queryFn: () => getCheckoutStatus(donationId as string),
    enabled: !!donationId,
    retry: false,
    refetchInterval: (q) =>
      q.state.data && EN_COURS.includes(q.state.data.status) ? 4000 : false,
  });

export const MES_DONS_PAGE = 10;

export const getMesDons = async ({
  year,
  offset = 0,
}: {
  year?: number;
  offset?: number;
}) =>
  paginatedSchema(myDonationSchema).parse(
    await api.get<unknown>('/v1/me/dons/', {
      params: { year, limit: MES_DONS_PAGE, offset },
    }),
  );

export const useMesDons = (filtres: { year?: number; offset?: number }) =>
  useQuery({
    queryKey: ['dons', 'mes-dons', filtres],
    queryFn: () => getMesDons(filtres),
    placeholderData: keepPreviousData,
  });

export const useResumeDons = (year: number) =>
  useQuery({
    queryKey: ['dons', 'resume', year],
    queryFn: async () =>
      donorSummarySchema.parse(
        await api.get<unknown>('/v1/me/dons/resume/', { params: { year } }),
      ),
  });

/** Reçu simple (PDF, pas un reçu fiscal) d'un don confirmé. */
export const telechargerRecu = async (don: MyDonation): Promise<void> => {
  const blob = await api.blob(
    `/v1/me/dons/${encodeURIComponent(don.id)}/recu/`,
  );
  saveBlob(blob, `recu-${don.reference}.pdf`);
};

// --------------------------------------------------------------- don

export type CheckoutInput = {
  fund_id: string;
  amount: number;
  fees_covered: boolean;
  anonymous: boolean;
  /** Clé d'idempotence : même clé = même don (double clic, reprise réseau). */
  idempotencyKey: string;
};

export const creerCheckout = async ({
  idempotencyKey,
  ...body
}: CheckoutInput): Promise<Checkout> =>
  checkoutSchema.parse(
    await api.post<unknown>(
      '/v1/dons/checkout/',
      { ...body, source: 'web' },
      { headers: { 'Idempotency-Key': idempotencyKey }, quiet: true },
    ),
  );

export const useCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerCheckout,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['dons', 'mes-dons'] }),
  });
};

/** Frais estimés (points de base : 200 = 2 %), arrondis au franc supérieur. */
export const fraisEstimes = (montant: number, feeRateBp: number): number =>
  Math.ceil((montant * feeRateBp) / 10_000);
