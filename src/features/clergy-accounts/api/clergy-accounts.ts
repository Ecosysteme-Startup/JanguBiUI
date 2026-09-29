import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

/** Dépôt d'une pièce (`POST /files/upload/standard/`) : identifiant du fichier. */
const deposerFichier = async (fichier: File): Promise<number> => {
  const form = new FormData();
  form.append('file', fichier);
  return z
    .object({ id: z.number() })
    .parse(await api.post('/files/upload/standard/', form)).id;
};

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

/** Pièce justificative facultative (§5.3) : `{id, file_name, file_type, url}`. */
export const justificatifSchema = z.object({
  id: z.union([z.number(), z.string()]),
  file_name: z.string(),
  file_type: z.string().default(''),
  url: z.string().nullish(),
});
export type Justificatif = z.infer<typeof justificatifSchema>;

/** Rôles filtrables (`role`) sur les listes de comptes. */
export const ROLES_FILTRE = [
  { value: 'pretre', label: 'Prêtre' },
  { value: 'diacre_permanent', label: 'Diacre permanent' },
  { value: 'diacre_transitoire', label: 'Diacre (transitoire)' },
  { value: 'eveque', label: 'Évêque' },
  { value: 'consacre', label: 'Consacré ou consacrée' },
] as const;

/** Statuts filtrables (`statut`) sur la liste générale. */
export const STATUTS_FILTRE = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'declare', label: 'Déclarés' },
  { value: 'complement', label: 'Complément demandé' },
  { value: 'verifie', label: 'Validés' },
  { value: 'rejete', label: 'Refusés' },
] as const;

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
  justificatif: justificatifSchema.nullish(),
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
  justificatif: justificatifSchema.nullish(),
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
        await api.get<unknown>('/clergy-accounts/invitations/', {
          params: {
            status: f.status || undefined,
            q: f.q?.trim() || undefined,
            limit: 50,
          },
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
  /** Pièce facultative, déposée d'abord par `files/upload/standard/`. */
  fichier?: File | null;
};

/** Dépose la pièce (si fournie) et renvoie son identifiant pour `justificatif_id`. */
const deposer = async (fichier?: File | null) =>
  fichier ? { justificatif_id: await deposerFichier(fichier) } : {};

export const useInviter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ fichier, ...data }: InvitationInput) =>
      invitationSchema.parse(
        await api.post<unknown>('/clergy-accounts/invitations/', {
          ...data,
          ...(await deposer(fichier)),
        }),
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
          `/clergy-accounts/invitations/${encodeURIComponent(id)}/revoke/`,
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
        await api.post<unknown>('/clergy-accounts/invitations/validate/', {
          token,
        }),
      ),
    enabled: !!token,
    retry: false,
  });

export const useAccepterInvitation = () =>
  useMutation({
    mutationFn: async ({
      token,
      fichier,
    }: {
      token: string;
      fichier?: File | null;
    }) =>
      compteClergeSchema.parse(
        await api.post<unknown>('/clergy-accounts/invitations/accept/', {
          token,
          ...(await deposer(fichier)),
        }),
      ),
  });

// --- Comptes (en attente, validés, tous) --------------------------------------------

export type FiltresComptes = {
  /** UUID d'un diocèse ou de tout nœud : son sous-arbre, borné à mon périmètre. */
  diocese?: string;
  role?: string;
  /** Liste générale seulement. */
  statut?: string;
  q?: string;
};

export type VueComptes = 'pending' | 'validated' | 'all';

const CHEMINS_VUE: Record<VueComptes, string> = {
  pending: '/clergy-accounts/pending/',
  validated: '/clergy-accounts/validated/',
  all: '/clergy-accounts/',
};

export const useComptesClerge = (vue: VueComptes, f: FiltresComptes = {}) =>
  useQuery({
    queryKey: ['clergy-accounts', vue, f],
    queryFn: async () =>
      page(compteClergeSchema).parse(
        await api.get<unknown>(CHEMINS_VUE[vue], {
          params: {
            diocese: f.diocese || undefined,
            role: f.role || undefined,
            statut: vue === 'all' ? f.statut || undefined : undefined,
            q: f.q?.trim() || undefined,
            limit: 50,
          },
        }),
      ),
    placeholderData: keepPreviousData,
  });

export const useComptesEnAttente = (f: FiltresComptes = {}) =>
  useComptesClerge('pending', f);

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
          `/clergy-accounts/${encodeURIComponent(id)}/${action}/`,
          action === 'refuse' ? { reason } : {},
        ),
      ),
    onSuccess: () =>
      Promise.all(
        (['pending', 'validated', 'all'] as const).map((vue) =>
          qc.invalidateQueries({ queryKey: ['clergy-accounts', vue] }),
        ),
      ),
  });
};
