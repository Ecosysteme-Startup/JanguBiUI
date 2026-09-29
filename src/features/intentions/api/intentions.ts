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
  place: z
    .object({ id: z.union([z.number(), z.string()]), name: z.string() })
    .nullable()
    .optional(),
  kind: z.string(),
  intention: z.string(),
  is_anonymous: z.boolean(),
  requested_date: z.string().nullable().optional(),
  requested_mass: z.string().default(''),
  status: z.string(),
  scheduled_date: z.string().nullable().optional(),
  scheduled_mass: z.string().default(''),
  scheduled_time: z.string().nullable().optional(),
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
      z
        .object({ notice: z.string() })
        .parse(await api.get<unknown>('/mass-intentions/notice/', {})).notice,
    staleTime: 60 * 60 * 1000,
  });

export const useMesIntentions = (limit = 20) =>
  useQuery({
    queryKey: ['mass-intentions', 'mine', limit],
    queryFn: async () =>
      page(intentionSchema).parse(
        await api.get<unknown>('/mass-intentions/mine/', {
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
  /** `null` : « Pas de date précise », le secrétariat choisit la messe. */
  requested_date: string | null;
  requested_mass?: string;
};

export const useDemanderIntention = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: IntentionInput) =>
      intentionSchema.parse(await api.post<unknown>('/mass-intentions/', data)),
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
          `/mass-intentions/${encodeURIComponent(id)}/cancel/`,
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
        await api.get<unknown>('/mass-intentions/parish/', {
          params: {
            node: f.node,
            status: f.status || undefined,
            date_from: f.date_from || undefined,
            date_to: f.date_to || undefined,
            limit: 50,
          },
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
      // Couvre aussi messes du jour et feuille (clés sous `parish`).
      qc.invalidateQueries({ queryKey: ['mass-intentions', 'parish'] }),
  });
};

const url = (id: string, action: string) =>
  `/mass-intentions/${encodeURIComponent(id)}/${action}/`;

/** Planifie ou déplace une intention reçue ou planifiée. */
export const usePlanifierIntention = () =>
  useDecision(
    (v: {
      id: string;
      scheduled_date: string;
      scheduled_mass?: string;
      /** `"10:00"` : messe précise, lieu requis et plafond appliqué. */
      scheduled_time?: string | null;
      place_id?: number | null;
    }) => url(v.id, 'accept'),
    ({
      scheduled_date,
      scheduled_mass = '',
      scheduled_time = null,
      place_id = null,
    }) => ({
      scheduled_date,
      scheduled_mass,
      place_id,
      ...(scheduled_time ? { scheduled_time } : {}),
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

// --- Messes du jour, feuille, plafond (§5.2) ---------------------------------------

export const PLAFOND_MIN = 1;
export const PLAFOND_MAX = 50;

const messeSchema = z.object({
  place_id: z.number(),
  place_name: z.string(),
  start_time: z.string(),
  label: z.string().default(''),
  language: z.string().default(''),
  note: z.string().default(''),
  intentions_count: z.number(),
  max_intentions: z.number().nullable(),
  cap_source: z.enum(['date', 'horaire', 'paroisse']).default('paroisse'),
  remaining: z.number().nullable(),
  is_full: z.boolean(),
});
export type MesseDuJour = z.infer<typeof messeSchema>;

const nodeRefSchema = z.object({ id: z.string(), name: z.string() });

export const messesDuJourSchema = z.object({
  node: nodeRefSchema,
  date: z.string(),
  max_per_mass: z.number().nullable(),
  masses: z.array(messeSchema),
  without_time_count: z.number().default(0),
});
export type MessesDuJour = z.infer<typeof messesDuJourSchema>;

const ligneFeuilleSchema = z.object({
  id: z.string(),
  kind: z.string(),
  kind_label: z.string().default(''),
  intention: z.string(),
  announced_as: z.string(),
  status: z.string(),
});
export type LigneFeuille = z.infer<typeof ligneFeuilleSchema>;

// La feuille ne porte jamais de montant (il n'en existe aucun).
export const feuilleSchema = z.object({
  node: nodeRefSchema,
  date: z.string(),
  masses: z.array(
    messeSchema.extend({ intentions: z.array(ligneFeuilleSchema) }),
  ),
  other_intentions: z.array(
    ligneFeuilleSchema.extend({ scheduled_mass: z.string().default('') }),
  ),
});
export type FeuilleIntentions = z.infer<typeof feuilleSchema>;

export const reglagesSchema = z.object({
  node: z.string(),
  max_per_mass: z.number().nullable(),
});

/** « 10:00:00 » → « 10:00 » (valeur attendue par `accept`). */
export const heureCourte = (t: string) => t.slice(0, 5);

export const useMessesDuJour = (node: string, date: string) =>
  useQuery({
    queryKey: ['mass-intentions', 'parish', 'messes', node, date],
    queryFn: async () =>
      messesDuJourSchema.parse(
        await api.get<unknown>('/mass-intentions/parish/messes/', {
          params: { node, date },
        }),
      ),
    enabled: !!node && !!date,
    placeholderData: keepPreviousData,
  });

export const useFeuilleIntentions = (node: string, date: string) =>
  useQuery({
    queryKey: ['mass-intentions', 'parish', 'feuille', node, date],
    queryFn: async () =>
      feuilleSchema.parse(
        await api.get<unknown>('/mass-intentions/parish/feuille/', {
          params: { node, date },
        }),
      ),
    enabled: !!node && !!date,
  });

export const useReglagesIntentions = (node: string) =>
  useQuery({
    queryKey: ['mass-intentions', 'parish', 'reglages', node],
    queryFn: async () =>
      reglagesSchema.parse(
        await api.get<unknown>('/mass-intentions/parish/reglages/', {
          params: { node },
        }),
      ),
    enabled: !!node,
  });

export const useModifierReglages = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { node: string; max_per_mass: number | null }) =>
      reglagesSchema.parse(
        await api.patch<unknown>('/mass-intentions/parish/reglages/', data),
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['mass-intentions', 'parish'] }),
  });
};

// --- Plafond propre à une messe (§5.2) -------------------------------------------

export type SourcePlafond = MesseDuJour['cap_source'];

export const LIBELLES_SOURCE_PLAFOND: Record<SourcePlafond, string> = {
  date: 'Plafond de ce jour',
  horaire: 'Plafond de chaque semaine à cette heure',
  paroisse: 'Plafond de la paroisse',
};

export const plafondMesseSchema = z.object({
  id: z.number(),
  place_id: z.number(),
  start_time: z.string(),
  weekday: z.number().nullable(),
  date: z.string().nullable(),
  max_intentions: z.number().nullable(),
});
export type PlafondMesse = z.infer<typeof plafondMesseSchema>;

/** Cible d'un plafond propre : exactement l'un de `weekday` ou `date`. */
export type CiblePlafond = {
  node: string;
  place_id: number;
  start_time: string;
} & ({ weekday: number; date?: null } | { date: string; weekday?: null });

/** 0 = lundi … 6 = dimanche (convention de l'API). */
export const jourSemaineApi = (dateIso: string) =>
  (new Date(`${dateIso}T12:00:00Z`).getUTCDay() + 6) % 7;

export const useFixerPlafondMesse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      data: CiblePlafond & { max_intentions: number | null },
    ) =>
      plafondMesseSchema.parse(
        await api.put<unknown>('/mass-intentions/parish/messes/plafond/', {
          weekday: null,
          date: null,
          ...data,
        }),
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['mass-intentions', 'parish'] }),
  });
};

export const useRetirerPlafondMesse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cible: CiblePlafond) => {
      const params: Record<string, string | number> = {
        node: cible.node,
        place_id: cible.place_id,
        start_time: cible.start_time,
      };
      if (cible.date) params.date = cible.date;
      else params.weekday = cible.weekday as number;
      await api.delete<unknown>('/mass-intentions/parish/messes/plafond/', {
        params,
      });
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['mass-intentions', 'parish'] }),
  });
};
