import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Comptes de la plateforme : `/v1/platform/accounts/` (capacité
// `plateforme.admin`). Contrat : backend apps/users/apis_accounts.py.

export const compteSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string(),
  realm_role: z.enum(['fidele', 'staff', 'platform_admin']),
  mfa: z.string(),
  last_login: z.string().nullable(),
  status: z.enum(['actif', 'verrouille', 'a_confirmer']),
  node_label: z.string().nullable(),
});
export type Compte = z.infer<typeof compteSchema>;

export const compteDetailSchema = compteSchema.extend({
  keycloak_id: z.string().nullable(),
  email_verified: z.boolean(),
  offices: z.array(
    z.object({
      office_label: z.string(),
      node_name: z.string(),
      start_date: z.string(),
      capabilities: z.array(z.string()),
    }),
  ),
  sessions: z.array(
    z.object({
      id: z.string(),
      client: z.string(),
      ip: z.string().nullable(),
      started_at: z.string().nullable(),
    }),
  ),
});
export type CompteDetail = z.infer<typeof compteDetailSchema>;

export const LIBELLES_ROLE: Record<Compte['realm_role'], string> = {
  fidele: 'Fidèle',
  staff: 'Responsable',
  platform_admin: 'Administrateur plateforme',
};

export const LIBELLES_STATUT_COMPTE: Record<Compte['status'], string> = {
  actif: 'Actif',
  verrouille: 'Verrouillé',
  a_confirmer: 'E-mail à confirmer',
};

export const LIBELLES_MFA: Record<string, string> = {
  totp: 'Code (TOTP)',
  webauthn: 'Clé de sécurité',
  facultative: 'Facultative (aucune)',
};

export const COMPTES_PAR_PAGE = 20;

export type FiltresComptes = {
  q?: string;
  role?: string;
  mfa?: string;
  status?: string;
  offset?: number;
};

const params = (f: FiltresComptes) => ({
  q: f.q?.trim() || undefined,
  role: f.role || undefined,
  mfa: f.mfa || undefined,
  status: f.status || undefined,
  limit: COMPTES_PAR_PAGE,
  offset: f.offset ?? 0,
});

export const useComptes = (f: FiltresComptes) =>
  useQuery({
    queryKey: ['platform-accounts', 'liste', params(f)],
    queryFn: async () =>
      z
        .object({ count: z.number(), results: z.array(compteSchema) })
        .parse(
          await api.get<unknown>('/v1/platform/accounts/', {
            params: params(f),
            quiet: true,
          }),
        ),
    placeholderData: keepPreviousData,
  });

export const useCompte = (id: string | null) =>
  useQuery({
    queryKey: ['platform-accounts', 'detail', id],
    queryFn: async () =>
      compteDetailSchema.parse(
        await api.get<unknown>(`/v1/platform/accounts/${id}/`, {
          quiet: true,
        }),
      ),
    enabled: !!id,
  });

export type ActionCompte = 'lock' | 'unlock' | 'logout-sessions' | 'require-mfa';

export const LIBELLES_ACTION: Record<ActionCompte, string> = {
  lock: 'Verrouiller',
  unlock: 'Déverrouiller',
  'logout-sessions': 'Fermer les sessions',
  'require-mfa': 'Exiger la MFA',
};

/** Action sur un compte (Keycloak) ; 503 si Keycloak est injoignable. */
export const useActionCompte = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: ActionCompte }) =>
      compteDetailSchema.parse(
        await api.post<unknown>(`/v1/platform/accounts/${id}/${action}/`, {}),
      ),
    onSuccess: (c) => {
      qc.setQueryData(['platform-accounts', 'detail', c.id], c);
      qc.invalidateQueries({ queryKey: ['platform-accounts', 'liste'] });
    },
  });
};
