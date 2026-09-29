import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { telechargerFichier } from '@/lib/staff/telecharger';

// Dons côté staff : `/v1/staff/dons/` (backend apps/donations/urls_staff.py,
// serializers.py). Paroisse : fonds, quêtes en espèces, opérations, export.
// Diocèse : quêtes impérées (suivi par paroisse) et reversements de
// l'agrégateur. Les montants sont des entiers en FCFA.

const lieuBref = z.object({ id: z.number(), name: z.string() });
const fondsBref = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.string(),
});

const pagine = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    count: z.number(),
    next: z.string().nullable().optional(),
    previous: z.string().nullable().optional(),
    results: z.array(item),
  });

// --- Fonds ----------------------------------------------------------------------

export const fondsSchema = z.object({
  id: z.string(),
  kind: z.string(),
  destination: z.string(),
  title: z.string(),
  description: z.string().default(''),
  starts_on: z.string().nullable(),
  ends_on: z.string().nullable(),
  goal_amount: z.number().nullable(),
  raised: z.number(),
  status: z.enum(['brouillon', 'ouvert', 'clos']),
  image_url: z.string().nullable().optional(),
  place: lieuBref.nullable().optional(),
  node_id: z.string(),
  parent_id: z.string().nullable(),
  donations_count: z.number(),
  authorization_ref: z.string().default(''),
  published_at: z.string().nullable(),
  closed_at: z.string().nullable(),
  created_at: z.string(),
});
export type Fonds = z.infer<typeof fondsSchema>;

export const LIBELLES_TYPE_FONDS: Record<string, string> = {
  quete_dominicale: 'Quête dominicale',
  quete_imperee: 'Quête impérée',
  campagne: 'Campagne pour un projet',
  contribution_annuelle: 'Contribution annuelle',
};

export const LIBELLES_STATUT_FONDS: Record<Fonds['status'], string> = {
  brouillon: 'Brouillon',
  ouvert: 'Ouvert',
  clos: 'Clos',
};

export const useFonds = (node: string | undefined, status?: string) =>
  useQuery({
    queryKey: ['staff-dons', 'fonds', node, status],
    queryFn: async () =>
      z.array(fondsSchema).parse(
        await api.get<unknown>('/v1/staff/dons/fonds/', {
          params: { node, status: status || undefined },
          quiet: true,
        }),
      ),
    enabled: !!node,
  });

export type NouveauFonds = {
  node: string;
  kind: 'quete_dominicale' | 'campagne' | 'contribution_annuelle';
  title: string;
  description?: string;
  goal_amount?: number | null;
  starts_on?: string | null;
  ends_on?: string | null;
};

export const useCreerFonds = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: NouveauFonds) =>
      fondsSchema.parse(await api.post<unknown>('/v1/staff/dons/fonds/', data)),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['staff-dons', 'fonds'] }),
  });
};

/** Publier (`publier/`) ou clore (`clore/`) un fonds. */
export const useEtapeFonds = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      etape,
    }: {
      id: string;
      etape: 'publier' | 'clore';
    }) =>
      fondsSchema.parse(
        await api.post<unknown>(`/v1/staff/dons/fonds/${id}/${etape}/`),
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['staff-dons', 'fonds'] }),
  });
};

// --- Quêtes en espèces ------------------------------------------------------------

export const queteSchema = z.object({
  id: z.number(),
  fund: fondsBref,
  place: z.string().nullable(),
  mass_date: z.string(),
  mass_label: z.string(),
  amount: z.number(),
  counter_one: z.string(),
  counter_two: z.string(),
  observation: z.string().default(''),
  status: z.enum(['saisie', 'validee', 'rejetee']),
  entered_by: z.string(),
  validated_by: z.string().nullable(),
  validated_at: z.string().nullable(),
  rejection_reason: z.string().default(''),
  deposit_id: z.number().nullable(),
  created_at: z.string(),
});
export type Quete = z.infer<typeof queteSchema>;

export const LIBELLES_STATUT_QUETE: Record<Quete['status'], string> = {
  saisie: 'À valider',
  validee: 'Validée',
  rejetee: 'Rejetée',
};

export const QUETES_PAR_PAGE = 20;

export const useQuetes = (
  node: string | undefined,
  status: string,
  offset: number,
) =>
  useQuery({
    queryKey: ['staff-dons', 'quetes', node, status, offset],
    queryFn: async () =>
      pagine(queteSchema).parse(
        await api.get<unknown>('/v1/staff/dons/quetes/', {
          params: {
            node,
            status: status || undefined,
            limit: QUETES_PAR_PAGE,
            offset,
          },
          quiet: true,
        }),
      ),
    placeholderData: keepPreviousData,
    enabled: !!node,
  });

/** Fonds proposés pour la saisie d'une quête à une date (dominicale, impérée). */
export const useFondsProposes = (node: string | undefined, date: string) =>
  useQuery({
    queryKey: ['staff-dons', 'fonds-proposes', node, date],
    queryFn: async () =>
      z.array(fondsSchema).parse(
        await api.get<unknown>('/v1/staff/dons/quetes/fonds-proposes/', {
          params: { node, date },
          quiet: true,
        }),
      ),
    enabled: !!node && /^\d{4}-\d{2}-\d{2}$/.test(date),
  });

export type NouvelleQuete = {
  node: string;
  fund_id: string;
  mass_date: string;
  mass_label: string;
  amount: number;
  counter_one: string;
  counter_two: string;
  observation?: string;
};

export const useSaisirQuete = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: NouvelleQuete) =>
      queteSchema.parse(
        await api.post<unknown>('/v1/staff/dons/quetes/', data),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-dons'] }),
  });
};

/** Valider (second regard) ou rejeter (motif obligatoire) une quête saisie. */
export const useDecisionQuete = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) =>
      queteSchema.parse(
        reason === undefined
          ? await api.post<unknown>(`/v1/staff/dons/quetes/${id}/valider/`)
          : await api.post<unknown>(`/v1/staff/dons/quetes/${id}/rejeter/`, {
              reason,
            }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-dons'] }),
  });
};

// --- Opérations -----------------------------------------------------------------

export const operationSchema = z.object({
  id: z.string(),
  reference: z.string(),
  receipt_number: z.string().nullable().optional(),
  fund: fondsBref,
  amount: z.number(),
  fee_amount: z.number(),
  net_amount: z.number(),
  channel: z.enum(['en_ligne', 'especes']),
  source: z.string().optional(),
  payment_method: z.string(),
  place: lieuBref.nullable().optional(),
  status: z.string(),
  created_at: z.string(),
  confirmed_at: z.string().nullable(),
  value_date: z.string().nullable(),
  anonymous: z.boolean(),
  donor: z.string(),
});
export type Operation = z.infer<typeof operationSchema>;

export const LIBELLES_STATUT_DON: Record<string, string> = {
  initie: 'Initié',
  en_attente: 'En attente',
  confirme: 'Confirmé',
  echoue: 'Échoué',
  expire: 'Expiré',
  rembourse: 'Remboursé',
};

export const LIBELLES_MOYEN: Record<string, string> = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  free_money: 'Free Money',
  carte: 'Carte bancaire',
  especes: 'Espèces',
  autre: 'Autre',
  inconnu: 'Inconnu',
};

export const OPERATIONS_PAR_PAGE = 20;

export type FiltresOperations = {
  status?: string;
  channel?: string;
  date_from?: string;
  date_to?: string;
};

export const useOperations = (
  node: string | undefined,
  filtres: FiltresOperations,
  offset: number,
) =>
  useQuery({
    queryKey: ['staff-dons', 'operations', node, filtres, offset],
    queryFn: async () =>
      pagine(operationSchema).parse(
        await api.get<unknown>('/v1/staff/dons/operations/', {
          params: {
            node,
            status: filtres.status || undefined,
            channel: filtres.channel || undefined,
            date_from: filtres.date_from || undefined,
            date_to: filtres.date_to || undefined,
            limit: OPERATIONS_PAR_PAGE,
            offset,
          },
          quiet: true,
        }),
      ),
    placeholderData: keepPreviousData,
    enabled: !!node,
  });

export const useRembourser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note = '' }: { id: string; note?: string }) =>
      operationSchema.parse(
        await api.post<unknown>(`/v1/staff/dons/operations/${id}/rembourser/`, {
          note,
        }),
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['staff-dons', 'operations'] }),
  });
};

export const donateurSchema = z.object({
  donation_id: z.string(),
  reference: z.string(),
  donateur: z.string().nullable(),
  sans_compte: z.boolean(),
});

/** Lever l'anonymat d'un don (`dons.voir_donateurs`, motif journalisé). */
export const useReveleDonateur = () =>
  useMutation({
    mutationFn: async ({ id, motif }: { id: string; motif: string }) =>
      donateurSchema.parse(
        await api.post<unknown>(`/v1/staff/dons/operations/${id}/donateur/`, {
          motif,
        }),
      ),
  });

// --- Export ---------------------------------------------------------------------

export const exporterDons = (p: {
  node: string;
  date_from: string;
  date_to: string;
  fichier: 'csv' | 'xlsx';
}) =>
  telechargerFichier(
    '/v1/staff/dons/export/',
    p,
    `dons-${p.date_from}-${p.date_to}.${p.fichier}`,
  );

// --- Diocèse : quêtes impérées et reversements -------------------------------------

export const quetesImpereeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(''),
  starts_on: z.string().nullable(),
  ends_on: z.string().nullable(),
  remit_by: z.string().nullable(),
  messe_anticipee_incluse: z.boolean(),
  status: z.string(),
  authorization_ref: z.string().default(''),
  raised: z.number(),
  parishes_count: z.number(),
  created_at: z.string(),
});
export type QueteImperee = z.infer<typeof quetesImpereeSchema>;

export const useQuetesImperees = (node: string | undefined) =>
  useQuery({
    queryKey: ['staff-dons', 'imperees', node],
    queryFn: async () =>
      z.array(quetesImpereeSchema).parse(
        await api.get<unknown>('/v1/staff/dons/quetes-imperees/', {
          params: { node },
          quiet: true,
        }),
      ),
    enabled: !!node,
  });

export type NouvelleQueteImperee = {
  node: string;
  title: string;
  description?: string;
  starts_on: string;
  remit_by?: string | null;
  authorization_ref?: string;
  messe_anticipee_incluse?: boolean;
};

export const useDefinirQueteImperee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: NouvelleQueteImperee) =>
      quetesImpereeSchema.parse(
        await api.post<unknown>('/v1/staff/dons/quetes-imperees/', data),
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['staff-dons', 'imperees'] }),
  });
};

export const suiviSchema = z.object({
  fund_id: z.string(),
  parish_id: z.string(),
  parish: z.string(),
  status: z.string(),
  online: z.number(),
  cash: z.number(),
  count: z.number(),
  total: z.number(),
  remitted_confirmed: z.number(),
  remitted_declared: z.number(),
  to_remit: z.number(),
  remit_by: z.string().nullable(),
});
export type SuiviParoisse = z.infer<typeof suiviSchema>;

export const useSuiviImperee = (fundId: string | null) =>
  useQuery({
    queryKey: ['staff-dons', 'imperee-suivi', fundId],
    queryFn: async () =>
      z
        .array(suiviSchema)
        .parse(
          await api.get<unknown>(
            `/v1/staff/dons/quetes-imperees/${fundId}/suivi/`,
            { quiet: true },
          ),
        ),
    enabled: !!fundId,
  });

export const reversementSchema = z.object({
  id: z.number(),
  provider: z.string(),
  external_ref: z.string(),
  paid_at: z.string().nullable(),
  gross_amount: z.number(),
  fee_amount: z.number(),
  net_amount: z.number(),
  status: z.enum(['recu', 'rapproche', 'ecart']),
  discrepancy_amount: z.number(),
  unmatched_count: z.number(),
  reconciled_at: z.string().nullable(),
});
export type Reversement = z.infer<typeof reversementSchema>;

export const LIBELLES_STATUT_REVERSEMENT: Record<
  Reversement['status'],
  string
> = {
  recu: 'Reçu, à rapprocher',
  rapproche: 'Rapproché',
  ecart: 'Écart constaté',
};

export const REVERSEMENTS_PAR_PAGE = 20;

export const useReversements = (node: string | undefined, offset: number) =>
  useQuery({
    queryKey: ['staff-dons', 'reversements', node, offset],
    queryFn: async () =>
      pagine(reversementSchema).parse(
        await api.get<unknown>('/v1/staff/dons/reversements/', {
          params: { node, limit: REVERSEMENTS_PAR_PAGE, offset },
          quiet: true,
        }),
      ),
    placeholderData: keepPreviousData,
    enabled: !!node,
  });
