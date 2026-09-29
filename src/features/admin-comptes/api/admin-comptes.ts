import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Administration des comptes synchronisée avec Keycloak : `/admin/…`
// (capacité `comptes.gerer` ou plateforme). Contrat : backend
// docs/ADMIN-KEYCLOAK.md et schema.yml (branche claude/v1-admin-keycloak).

const BASE = '/admin';

export const noeudRefSchema = z.object({ id: z.string(), name: z.string() });
export type NoeudRef = z.infer<typeof noeudRefSchema>;

export const STATUTS = ['actif', 'desactive', 'en_attente'] as const;
export const ROLES = ['fidele', 'staff', 'platform_admin'] as const;
export const SYNCS = ['synchronise', 'non_lie', 'ecart'] as const;
export const ETATS_DE_VIE = ['laic', 'clerc', 'consacre'] as const;
export const DEGRES_ORDRE = [
  'aucun',
  'diacre_transitoire',
  'diacre_permanent',
  'pretre',
  'eveque',
] as const;

export const compteSchema = z.object({
  id: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  full_name: z.string(),
  phone_number: z.string().nullable(),
  status: z.enum(STATUTS),
  role: z.enum(ROLES),
  etat_de_vie: z.enum(ETATS_DE_VIE),
  email_verified: z.boolean(),
  keycloak_id: z.string().nullable(),
  sync: z.enum(SYNCS),
  sync_error: z.string().nullable(),
  synced_at: z.string().nullable(),
  admin_node: noeudRefSchema.nullable(),
  created_at: z.string(),
  last_login: z.string().nullable(),
  last_seen_on: z.string().nullable(),
  can_manage: z.boolean().default(true),
});
export type Compte = z.infer<typeof compteSchema>;

export const officeSchema = z.object({
  id: z.number(),
  office: z.string(),
  office_label: z.string(),
  node: noeudRefSchema,
  status: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable(),
});
export type Office = z.infer<typeof officeSchema>;

export const sessionSchema = z.object({
  id: z.string(),
  ip: z.string().nullable(),
  started_at: z.string().nullable(),
  last_access: z.string().nullable(),
  clients: z.array(z.string()),
});
export type SessionKc = z.infer<typeof sessionSchema>;

export const etatKeycloakSchema = z.object({
  available: z.boolean(),
  exists: z.boolean().optional(),
  enabled: z.boolean().optional(),
  email_verified: z.boolean().optional(),
  required_actions: z.array(z.string()).default([]),
  otp: z.boolean().optional(),
  webauthn: z.boolean().optional(),
  password: z.boolean().optional(),
  realm_roles: z.array(z.string()).default([]),
  groups: z.array(z.string()).default([]),
  locked_by_brute_force: z.boolean().optional(),
  failed_logins: z.number().optional(),
  sessions: z.array(sessionSchema).default([]),
});
export type EtatKeycloak = z.infer<typeof etatKeycloakSchema>;

export const compteDetailSchema = compteSchema.extend({
  statut_verification: z.string().optional(),
  degre_ordre: z.string().optional(),
  offices: z.array(officeSchema).default([]),
  scope_nodes: z.array(noeudRefSchema).default([]),
  keycloak: etatKeycloakSchema.nullable(),
});
export type CompteDetail = z.infer<typeof compteDetailSchema>;

export const perimetreSchema = z.object({
  is_platform_admin: z.boolean(),
  nodes: z.array(noeudRefSchema),
  required_actions: z.array(z.string()),
  impersonation: z.boolean(),
});
export type Perimetre = z.infer<typeof perimetreSchema>;

export const tableauBordSchema = z.object({
  comptes: z.object({
    total: z.number(),
    actifs: z.number(),
    en_attente: z.number(),
    desactives: z.number(),
    responsables: z.number(),
    administrateurs_plateforme: z.number(),
    crees_30_jours: z.number(),
    non_lies: z.number(),
    ecarts: z.number(),
    invitations_en_attente: z.number(),
  }),
  synchronisation: z.object({
    derniere_reconciliation: z.string().nullable(),
    derniere_reconciliation_reussie: z.boolean().nullable(),
    ecarts_derniere_reconciliation: z.number().nullable(),
  }),
});
export type TableauBord = z.infer<typeof tableauBordSchema>;

export const auditSchema = z.object({
  id: z.number(),
  at: z.string(),
  action: z.string(),
  actor_id: z.string().nullable(),
  actor_email: z.string().nullable(),
  target_id: z.string(),
  target_email: z.string().nullable(),
  node: noeudRefSchema.nullable(),
  metadata: z.unknown(),
});
export type EntreeAudit = z.infer<typeof auditSchema>;

export const passageSchema = z.object({
  id: z.number(),
  started_at: z.string(),
  finished_at: z.string().nullable(),
  dry_run: z.boolean(),
  trigger: z.string(),
  success: z.boolean(),
  error: z.string(),
  counts: z.record(z.string(), z.number()).catch({}),
});
export type Passage = z.infer<typeof passageSchema>;

export const ecartSchema = z.object({
  kind: z.string(),
  keycloak_id: z.string().nullable().optional(),
  user_id: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  fields: z.array(z.string()).nullable().optional(),
  correction: z.string().nullable().optional(),
});
export type Ecart = z.infer<typeof ecartSchema>;

export const passageDetailSchema = passageSchema.extend({
  report: z
    .union([
      z.array(ecartSchema),
      z
        .object({ ecarts: z.array(ecartSchema).default([]) })
        .transform((r) => r.ecarts),
    ])
    .catch([]),
});
export type PassageDetail = z.infer<typeof passageDetailSchema>;

export const etatSyncSchema = z.object({
  enabled: z.boolean(),
  events_polling: z.boolean(),
  webhook_enabled: z.boolean(),
  curseurs: z.array(
    z.object({
      name: z.string(),
      last_event_at: z.string().nullable(),
      last_polled_at: z.string().nullable(),
      last_error: z.string().nullable(),
    }),
  ),
  comptes_non_lies: z.number(),
  comptes_en_ecart: z.number(),
  ecarts_par_type: z.record(z.string(), z.number()),
  evenements: z.object({
    recus: z.number(),
    echecs: z.number(),
    traites_24h: z.number(),
    dernier_recu: z.string().nullable(),
  }),
  reconciliations: z.array(passageSchema),
});
export type EtatSync = z.infer<typeof etatSyncSchema>;

// --- Libellés ------------------------------------------------------------------

export const LIBELLES_STATUT: Record<Compte['status'], string> = {
  actif: 'Actif',
  desactive: 'Désactivé',
  en_attente: 'En attente',
};
export const LIBELLES_ROLE: Record<Compte['role'], string> = {
  fidele: 'Fidèle',
  staff: 'Responsable',
  platform_admin: 'Administrateur plateforme',
};
export const LIBELLES_SYNC: Record<Compte['sync'], string> = {
  synchronise: 'Synchronisé avec Keycloak',
  non_lie: 'Non relié à Keycloak',
  ecart: 'Écart avec Keycloak',
};
export const LIBELLES_ETAT_DE_VIE: Record<Compte['etat_de_vie'], string> = {
  laic: 'Laïc',
  clerc: 'Clerc',
  consacre: 'Consacré',
};
export const LIBELLES_DEGRE: Record<(typeof DEGRES_ORDRE)[number], string> = {
  aucun: 'Aucun',
  diacre_transitoire: 'Diacre (transitoire)',
  diacre_permanent: 'Diacre permanent',
  pretre: 'Prêtre',
  eveque: 'Évêque',
};
export const LIBELLES_ACTIONS_REQUISES: Record<string, string> = {
  UPDATE_PASSWORD: 'Choisir un nouveau mot de passe',
  VERIFY_EMAIL: 'Vérifier l’adresse e-mail',
  CONFIGURE_TOTP: 'Configurer la double authentification',
  UPDATE_PROFILE: 'Compléter le profil',
  TERMS_AND_CONDITIONS: 'Accepter les conditions d’utilisation',
};
export const LIBELLES_ECART: Record<string, string> = {
  application_seule: 'Seulement dans Jàngu Bi',
  keycloak_seul: 'Seulement dans Keycloak',
  champs_differents: 'Informations différentes',
  supprime_dans_keycloak: 'Supprimé dans Keycloak',
  supprime_avec_nominations: 'Supprimé dans Keycloak, fonction en cours',
  conflit_email: 'Conflit d’adresse e-mail',
};

// --- Requêtes ------------------------------------------------------------------

export const COMPTES_PAR_PAGE = 25;

export type FiltresComptes = {
  q?: string;
  status?: string;
  role?: string;
  sync?: string;
  etat_de_vie?: string;
  node?: string;
  created_from?: string;
  created_to?: string;
  ordering?: string;
  offset?: number;
};

export const paramsComptes = (f: FiltresComptes) => ({
  q: f.q?.trim() || undefined,
  status: f.status || undefined,
  role: f.role || undefined,
  sync: f.sync || undefined,
  etat_de_vie: f.etat_de_vie || undefined,
  node: f.node || undefined,
  created_from: f.created_from || undefined,
  created_to: f.created_to || undefined,
  ordering: f.ordering || undefined,
});

const CLE = 'admin-comptes';

export const usePerimetre = () =>
  useQuery({
    queryKey: [CLE, 'scope'],
    queryFn: async () =>
      perimetreSchema.parse(await api.get<unknown>(`${BASE}/scope/`)),
    staleTime: 5 * 60 * 1000,
  });

export const useTableauBord = () =>
  useQuery({
    queryKey: [CLE, 'dashboard'],
    queryFn: async () =>
      tableauBordSchema.parse(await api.get<unknown>(`${BASE}/dashboard/`)),
  });

export const useComptes = (f: FiltresComptes) =>
  useQuery({
    queryKey: [CLE, 'liste', paramsComptes(f), f.offset ?? 0],
    queryFn: async () =>
      z.object({ count: z.number(), results: z.array(compteSchema) }).parse(
        await api.get<unknown>(`${BASE}/accounts/`, {
          params: {
            ...paramsComptes(f),
            limit: COMPTES_PAR_PAGE,
            offset: f.offset ?? 0,
          },
        }),
      ),
    placeholderData: keepPreviousData,
  });

export const exporterComptes = (f: FiltresComptes) =>
  api.blob(`${BASE}/accounts/export/`, { params: paramsComptes(f) });

export const useCompte = (id: string | null | undefined) =>
  useQuery({
    queryKey: [CLE, 'detail', id],
    queryFn: async () =>
      compteDetailSchema.parse(
        await api.get<unknown>(`${BASE}/accounts/${id}/`),
      ),
    enabled: !!id,
  });

export type CreationCompte = {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  node_id: string;
  etat_de_vie: Compte['etat_de_vie'];
  degre_ordre: (typeof DEGRES_ORDRE)[number];
  send_invitation: boolean;
};

const useInvalider = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [CLE] });
};

export const useCreerCompte = () => {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async (input: CreationCompte) =>
      compteSchema.parse(await api.post<unknown>(`${BASE}/accounts/`, input)),
    onSuccess: invalider,
  });
};

export type ModificationCompte = Partial<{
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  admin_node_id: string | null;
}>;

export const useModifierCompte = (id: string) => {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async (input: ModificationCompte) =>
      compteSchema.parse(
        await api.patch<unknown>(`${BASE}/accounts/${id}/`, input, {}),
      ),
    onSuccess: invalider,
  });
};

export const useSupprimerCompte = (id: string) => {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async (input: { confirm_email: string; reason: string }) =>
      api.delete<null>(`${BASE}/accounts/${id}/`, {
        body: input,
      }),
    onSuccess: invalider,
  });
};

export type ActionCompte =
  | 'disable'
  | 'enable'
  | 'password-reset'
  | 'actions-email'
  | 'verify-email'
  | 'mark-email-verified'
  | 'logout'
  | 'otp-reset'
  | 'brute-force-unlock'
  | 'platform-admin'
  | 'resync';

/** Actions dont le motif est obligatoire (journalisé). */
export const ACTIONS_AVEC_MOTIF: ActionCompte[] = [
  'disable',
  'mark-email-verified',
  'otp-reset',
  'platform-admin',
];

export const useActionCompte = (id: string) => {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async ({
      action,
      body,
    }: {
      action: ActionCompte;
      body?: Record<string, unknown>;
    }) =>
      compteSchema.parse(
        await api.post<unknown>(
          `${BASE}/accounts/${id}/${action}/`,
          body ?? {},
        ),
      ),
    onSuccess: invalider,
  });
};

export const useFermerSession = (id: string) => {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: (sid: string) =>
      api.delete<null>(
        `${BASE}/accounts/${id}/sessions/${encodeURIComponent(sid)}/`,
      ),
    onSuccess: invalider,
  });
};

export const useAjouterOffice = (id: string) => {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async (input: {
      office_type: string;
      node_id: string;
      start_date?: string;
    }) =>
      officeSchema.parse(
        await api.post<unknown>(`${BASE}/accounts/${id}/offices/`, input, {}),
      ),
    onSuccess: invalider,
  });
};

export const useFinOffice = (id: string) => {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async (aid: number) =>
      officeSchema.parse(
        await api.post<unknown>(
          `${BASE}/accounts/${id}/offices/${aid}/end/`,
          {},
        ),
      ),
    onSuccess: invalider,
  });
};

export const AUDIT_PAR_PAGE = 25;

export type FiltresAudit = {
  account?: string;
  actor?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  offset?: number;
  limit?: number;
};

export const useAuditComptes = (f: FiltresAudit) =>
  useQuery({
    queryKey: [CLE, 'audit', f],
    queryFn: async () =>
      z.object({ count: z.number(), results: z.array(auditSchema) }).parse(
        await api.get<unknown>(`${BASE}/audit/`, {
          params: {
            account: f.account || undefined,
            actor: f.actor?.trim() || undefined,
            action: f.action || undefined,
            date_from: f.date_from || undefined,
            date_to: f.date_to || undefined,
            limit: f.limit ?? AUDIT_PAR_PAGE,
            offset: f.offset ?? 0,
          },
        }),
      ),
    placeholderData: keepPreviousData,
  });

export const useEtatSync = (enabled = true) =>
  useQuery({
    queryKey: [CLE, 'sync'],
    queryFn: async () =>
      etatSyncSchema.parse(await api.get<unknown>(`${BASE}/sync/`)),
    enabled,
  });

export const usePassage = (runId: number | null | undefined) =>
  useQuery({
    queryKey: [CLE, 'sync', 'run', runId],
    queryFn: async () =>
      passageDetailSchema.parse(
        await api.get<unknown>(`${BASE}/sync/runs/${runId}/`),
      ),
    enabled: runId != null,
  });

export const useLancerReconciliation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dryRun: boolean) =>
      passageDetailSchema.parse(
        await api.post<unknown>(`${BASE}/sync/runs/`, { dry_run: dryRun }),
      ),
    onSuccess: (run) => {
      qc.setQueryData([CLE, 'sync', 'run', run.id], run);
      qc.invalidateQueries({ queryKey: [CLE] });
    },
  });
};
