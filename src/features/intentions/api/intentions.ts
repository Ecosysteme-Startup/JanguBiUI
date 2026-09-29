import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Intentions de messe — backend `docs/API-V1-COMPLEMENTS.md` §4
// (apps/intentions/serializers.py). AUCUN montant ni paiement : l'offrande se
// remet directement à la paroisse ; chaque réponse fidèle porte `notice`.

export const TYPES_INTENTION = [
  'defunt',
  'action_de_graces',
  'particuliere',
] as const;
export type TypeIntention = (typeof TYPES_INTENTION)[number];

export const LIBELLES_TYPE_INTENTION: Record<string, string> = {
  defunt: 'Pour un défunt',
  action_de_graces: 'Action de grâce',
  particuliere: 'Intention particulière',
};

/** Texte des maquettes (ECRANS-V1-COMPLEMENTS §3), affiché près du formulaire. */
export const PHRASE_OFFRANDE =
  'Il est d’usage d’accompagner une intention d’une offrande. Elle se remet directement à la paroisse, au secrétariat ou à la sacristie ; elle ne passe pas par l’application.';

const refSchema = z.object({ id: z.string(), name: z.string() });

export const intentionSchema = z.object({
  id: z.string(),
  parish: refSchema,
  place: refSchema.nullable().optional(),
  kind: z.string(),
  intention: z.string(),
  is_anonymous: z.boolean(),
  requested_date: z.string().nullable().optional(),
  requested_mass: z.string().default(''),
  status: z.string(),
  scheduled_date: z.string().nullable().optional(),
  scheduled_mass: z.string().default(''),
  refusal_reason: z.string().default(''),
  celebrated_at: z.string().nullable().optional(),
  cancelled_at: z.string().nullable().optional(),
  created_at: z.string(),
  notice: z.string().optional(),
});
export type MassIntention = z.infer<typeof intentionSchema>;

export const intentionStaffSchema = intentionSchema.extend({
  requester_name: z.string(),
  announced_as: z.string(),
  decided_at: z.string().nullable().optional(),
});
export type StaffMassIntention = z.infer<typeof intentionStaffSchema>;

const page = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    count: z.number(),
    next: z.string().nullish(),
    previous: z.string().nullish(),
    results: z.array(item),
  });

// --- Fidèle -------------------------------------------------------------------------

export const useNoticeOffrande = () =>
  useQuery({
    queryKey: ['mass-intentions', 'notice'],
    queryFn: async () =>
      z.object({ notice: z.string() }).parse(
        await api.get<unknown>('/v1/mass-intentions/notice/', {
          quiet: true,
        }),
      ).notice,
    staleTime: 60 * 60 * 1000,
  });

export const useMesIntentions = (limit = 20) =>
  useQuery({
    queryKey: ['mass-intentions', 'mine', limit],
    queryFn: async () =>
      page(intentionSchema).parse(
        await api.get<unknown>('/v1/mass-intentions/mine/', {
          params: { limit },
        }),
      ),
  });

export type IntentionInput = {
  node: string;
  place_id?: number | null;
  kind: TypeIntention;
  intention: string;
  is_anonymous: boolean;
  requested_date: string;
  requested_mass?: string;
};

export const useDemanderIntention = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: IntentionInput) =>
      intentionSchema.parse(
        await api.post<unknown>('/v1/mass-intentions/', data),
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['mass-intentions', 'mine'] }),
  });
};

export const useAnnulerIntention = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      intentionSchema.parse(
        await api.post<unknown>(
          `/v1/mass-intentions/${encodeURIComponent(id)}/cancel/`,
          {},
        ),
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['mass-intentions', 'mine'] }),
  });
};

// --- Secrétariat (capacité `intentions.gerer`) --------------------------------------

export type FiltresIntentionsParoisse = {
  node: string;
  status?: string;
  date_from?: string;
  date_to?: string;
};

export const useIntentionsParoisse = (f: FiltresIntentionsParoisse) =>
  useQuery({
    queryKey: ['mass-intentions', 'parish', f],
    queryFn: async () =>
      page(intentionStaffSchema).parse(
        await api.get<unknown>('/v1/mass-intentions/parish/', {
          params: {
            node: f.node,
            status: f.status || undefined,
            date_from: f.date_from || undefined,
            date_to: f.date_to || undefined,
            limit: 50,
          },
          quiet: true,
        }),
      ),
    placeholderData: keepPreviousData,
    enabled: !!f.node,
  });

const useDecision = <V>(chemin: (v: V) => string, corps: (v: V) => object) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: V) =>
      intentionStaffSchema.parse(await api.post<unknown>(chemin(v), corps(v))),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['mass-intentions', 'parish'] }),
  });
};

const url = (id: string, action: string) =>
  `/v1/mass-intentions/${encodeURIComponent(id)}/${action}/`;

/** Planifie ou déplace une intention reçue ou planifiée. */
export const usePlanifierIntention = () =>
  useDecision(
    (v: {
      id: string;
      scheduled_date: string;
      scheduled_mass?: string;
      place_id?: number | null;
    }) => url(v.id, 'accept'),
    ({ scheduled_date, scheduled_mass = '', place_id = null }) => ({
      scheduled_date,
      scheduled_mass,
      place_id,
    }),
  );

export const useRefuserIntention = () =>
  useDecision(
    (v: { id: string; reason: string }) => url(v.id, 'decline'),
    ({ reason }) => ({ reason }),
  );

export const useCelebrerIntention = () =>
  useDecision(
    (v: { id: string }) => url(v.id, 'celebrate'),
    () => ({}),
  );
