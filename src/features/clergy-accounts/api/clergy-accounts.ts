import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Comptes du clergé — backend `docs/API-V1-COMPLEMENTS.md` §1
// (apps/invitations/serializers.py). Capacité `comptes.valider` (diocèse ou
// plateforme) ; la validation et l'acceptation publiques prennent `{token}`.

export const LIBELLES_ETAT_DE_VIE: Record<string, string> = {
  clerc: 'Clerc',
  consacre: 'Consacré ou consacrée',
  laic: 'Laïc',
};

export const LIBELLES_DEGRE: Record<string, string> = {
  aucun: '',
  diacre_transitoire: 'Diacre',
  diacre_permanent: 'Diacre permanent',
  pretre: 'Prêtre',
  eveque: 'Évêque',
};

/** « Prêtre », « Diacre permanent », « Consacré ou consacrée »… */
export const libelleRole = (etat: string, degre: string): string =>
  LIBELLES_DEGRE[degre] || LIBELLES_ETAT_DE_VIE[etat] || etat;

const refSchema = z.object({ id: z.string(), name: z.string() });

export const invitationSchema = z.object({
  id: z.string(),
  email: z.string(),
  first_name: z.string().default(''),
  last_name: z.string().default(''),
  node: refSchema,
  etat_de_vie: z.string(),
  degre_ordre: z.string(),
  status: z.enum(['en_attente', 'acceptee', 'revoquee', 'expiree']),
  expires_at: z.string(),
  invited_by_name: z.string().default(''),
  accepted_at: z.string().nullable().optional(),
  revoked_at: z.string().nullable().optional(),
  created_at: z.string(),
  accept_url: z.string().optional(),
});
export type Invitation = z.infer<typeof invitationSchema>;

export const invitationPubliqueSchema = z.object({
  email_masked: z.string(),
  first_name: z.string().default(''),
  node_name: z.string(),
  etat_de_vie: z.string(),
  degre_ordre: z.string(),
  expires_at: z.string(),
  register_url: z.string(),
});
export type InvitationPublique = z.infer<typeof invitationPubliqueSchema>;

export const compteClergeSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string().default(''),
  etat_de_vie: z.string(),
  degre_ordre: z.string(),
  statut_verification: z.string(),
  verification_note: z.string().default(''),
  declared_at: z.string().nullable().optional(),
  is_active: z.boolean(),
  node: refSchema.nullable(),
});
export type CompteClerge = z.infer<typeof compteClergeSchema>;

const page = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    count: z.number(),
    next: z.string().nullish(),
    previous: z.string().nullish(),
    results: z.array(item),
  });

// --- Invitations --------------------------------------------------------------------

export const useInvitations = (f: { status?: string; q?: string } = {}) =>
  useQuery({
    queryKey: ['clergy-accounts', 'invitations', f],
    queryFn: async () =>
      page(invitationSchema).parse(
        await api.get<unknown>('/v1/clergy-accounts/invitations/', {
          params: {
            status: f.status || undefined,
            q: f.q?.trim() || undefined,
            limit: 50,
          },
          quiet: true,
        }),
      ),
    placeholderData: keepPreviousData,
  });

export type InvitationInput = {
  node: string;
  email: string;
  first_name: string;
  last_name: string;
  etat_de_vie: 'clerc' | 'consacre';
  degre_ordre: string;
  ttl_days?: number;
};

export const useInviter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: InvitationInput) =>
      invitationSchema.parse(
        await api.post<unknown>('/v1/clergy-accounts/invitations/', data),
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['clergy-accounts', 'invitations'] }),
  });
};

export const useRevoquerInvitation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      invitationSchema.parse(
        await api.post<unknown>(
          `/v1/clergy-accounts/invitations/${encodeURIComponent(id)}/revoke/`,
          {},
        ),
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['clergy-accounts', 'invitations'] }),
  });
};

/** Page publique : `POST …/validate/ {token}` (410 si invalide ou expiré). */
export const useInvitationParJeton = (token: string) =>
  useQuery({
    queryKey: ['clergy-accounts', 'token', token],
    queryFn: async () =>
      invitationPubliqueSchema.parse(
        await api.post<unknown>(
          '/v1/clergy-accounts/invitations/validate/',
          { token },
          { quiet: true },
        ),
      ),
    enabled: !!token,
    retry: false,
  });

export const useAccepterInvitation = () =>
  useMutation({
    mutationFn: async (token: string) =>
      compteClergeSchema.parse(
        await api.post<unknown>(
          '/v1/clergy-accounts/invitations/accept/',
          { token },
          { quiet: true },
        ),
      ),
  });

// --- Comptes en attente -------------------------------------------------------------

export const useComptesEnAttente = () =>
  useQuery({
    queryKey: ['clergy-accounts', 'pending'],
    queryFn: async () =>
      page(compteClergeSchema).parse(
        await api.get<unknown>('/v1/clergy-accounts/pending/', {
          params: { limit: 50 },
          quiet: true,
        }),
      ),
  });

export type ActionCompte = 'validate' | 'refuse' | 'activate' | 'deactivate';

export const useActionCompte = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: ActionCompte;
      reason?: string;
    }) =>
      compteClergeSchema.parse(
        await api.post<unknown>(
          `/v1/clergy-accounts/${encodeURIComponent(id)}/${action}/`,
          action === 'refuse' ? { reason } : {},
        ),
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['clergy-accounts', 'pending'] }),
  });
};
