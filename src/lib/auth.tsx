import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import {
  ApiError,
  api,
  clearSession,
  getAccessToken,
  getRefreshToken,
} from './api-client';
import { buildAuthorizationUrl, buildEndSessionUrl, readSession } from './oidc';

// Dimension 1 — capacité d'administration digitale. Reflète le champ `role`
// du backend (apps.users.enums.UserRole) : il ne contient JAMAIS une valeur
// pastorale. L'identité clergé vit dans `pastoral_role` (dimension 2).
export type UserRole =
  | 'super_admin'
  | 'province_admin'
  | 'diocese_admin'
  | 'parish_admin'
  | 'church_admin'
  | 'fidele';

// Dimension 2 — identité dans l'Église. Reflète `pastoral_role` (nullable).
export type PastoralRole =
  | 'fidele'
  | 'religieux'
  | 'diacre'
  | 'pretre'
  | 'eveque'
  | 'archeveque';

export type OnboardingState = 'pending_email' | 'pending_parish' | 'completed';

export const ADMIN_ROLES: UserRole[] = [
  'super_admin',
  'province_admin',
  'diocese_admin',
  'parish_admin',
  'church_admin',
];

// Clergé = sous-ensemble pastoral (exclut 'fidele', qui est pastoral mais laïc).
// Typé PastoralRole[] : ces valeurs se comparent à `user.pastoral_role`, jamais
// à `user.role`.
export const CLERGY_ROLES: PastoralRole[] = [
  'archeveque',
  'eveque',
  'pretre',
  'diacre',
  'religieux',
];

export interface UserProfile {
  first_name: string;
  last_name: string;
  title?: string;
  phone?: string;
  // /me renvoie la paroisse principale en {id, name} | null (et non un id brut).
  primary_parish?: OrgRef | null;
  avatar?: string | null;
}

export interface OrgRef {
  id: number;
  name: string;
}

export interface Membership {
  id: number;
  church: OrgRef;
  parish: OrgRef;
  diocese: OrgRef;
  is_primary: boolean;
}

export interface User {
  id: string;
  email: string;
  phone_number?: string;
  role: UserRole;
  pastoral_role?: PastoralRole | null;
  onboarding_state: OnboardingState;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  is_staff: boolean;
  profile: UserProfile;
  // Hiérarchie territoriale dérivée de l'appartenance principale — /me les
  // renvoie au niveau racine en {id, name} | null.
  diocese?: OrgRef | null;
  province?: OrgRef | null;
  // Multi-appartenance (Chantier 7b) — exposées par /me (singuliers conservés).
  memberships?: Membership[];
  church_ids?: number[];
  parish_ids?: number[];
  diocese_ids?: number[];
  // Capacités effectives (`dons.voir_fonds`, `dons.voir_agregats`,
  // `audio.publier`, `plateforme.admin`…), lues sur /v1/me/capacites/.
  // Absentes → repli sur les rôles (anciens mocks).
  capabilities?: string[];
  // Champs du contrat V1 (/v1/me/), conservés tels quels.
  etat_de_vie?: string;
  degre_ordre?: string;
  statut_verification?: string;
  paroisse_suivie?: { id: string; name: string } | null;
  /** /me/capacites/ a répondu 403 `mfa_required` : reconnexion avec OTP. */
  mfa_required?: boolean;
}

// -----------------------------------------------------------------------------
// Personne connectée : GET /v1/me/ + GET /v1/me/capacites/
// -----------------------------------------------------------------------------

const nodeRefSchema = z.object({ id: z.string(), name: z.string() });

/** Contrat réel de `GET /v1/me/` (apps/users/apis_privacy.MeOutputSerializer). */
export const meSchema = z.object({
  id: z.string(),
  email: z.string(),
  profile: z.object({
    first_name: z.string().default(''),
    last_name: z.string().default(''),
    title: z.string().nullish(),
    date_of_birth: z.string().nullish(),
    phone: z.string().nullish(),
  }),
  etat_de_vie: z.string().default('laic'),
  degre_ordre: z.string().default('aucun'),
  statut_verification: z.string().default('declare'),
  incardination: nodeRefSchema.nullish(),
  institut: nodeRefSchema.nullish(),
  paroisse_suivie: nodeRefSchema.nullish(),
  consent: z.unknown().optional(),
});
export type Me = z.infer<typeof meSchema>;

/** `GET /v1/me/capacites/` (CapaciteOutputSerializer). */
export const capaciteSchema = z.object({
  capacite: z.string(),
  node_id: z.string().nullable(),
  node_name: z.string(),
  node_type: z.string(),
  herite: z.boolean(),
  office: z.string(),
  office_label: z.string(),
});
export type CapaciteMe = z.infer<typeof capaciteSchema>;

// Rôle d'interface dérivé des nominations (le back n'a plus de champ `role` :
// les droits sont des capacités sur des nœuds). Sert au choix de la navigation ;
// le back reste seul juge (403).
const ROLE_PAR_NOEUD: Record<string, UserRole> = {
  province: 'province_admin',
  diocese: 'diocese_admin',
  zone: 'diocese_admin',
  doyenne: 'diocese_admin',
  paroisse: 'parish_admin',
  quasi_paroisse: 'parish_admin',
};
const RANG: UserRole[] = [
  'fidele',
  'church_admin',
  'parish_admin',
  'diocese_admin',
  'province_admin',
  'super_admin',
];

export const roleFromCapacites = (capacites: CapaciteMe[]): UserRole => {
  let role: UserRole = 'fidele';
  for (const c of capacites) {
    const candidat: UserRole =
      c.capacite === 'plateforme.admin'
        ? 'super_admin'
        : (ROLE_PAR_NOEUD[c.node_type] ?? 'church_admin');
    if (RANG.indexOf(candidat) > RANG.indexOf(role)) role = candidat;
  }
  return role;
};

/** Identité pastorale : seulement un état de vie VÉRIFIÉ (un état déclaré
 *  n'a aucun effet, contrat /me/declaration/). */
export const pastoralRoleFromMe = (me: Me): PastoralRole | null => {
  if (me.statut_verification !== 'verifie') return null;
  if (me.degre_ordre === 'eveque') return 'eveque';
  if (me.degre_ordre === 'pretre') return 'pretre';
  if (me.degre_ordre.startsWith('diacre')) return 'diacre';
  if (me.etat_de_vie === 'consacre') return 'religieux';
  return null;
};

export const userFromMe = (
  me: Me,
  capacites: CapaciteMe[],
  { mfaRequired = false }: { mfaRequired?: boolean } = {},
): User => {
  const role = roleFromCapacites(capacites);
  return {
    id: me.id,
    email: me.email,
    role,
    pastoral_role: pastoralRoleFromMe(me),
    // Vérification de l'e-mail et inscription : dans Keycloak. La paroisse
    // suivie est facultative, elle ne bloque pas l'accès.
    onboarding_state: 'completed',
    is_active: true,
    is_verified: true,
    is_admin: role !== 'fidele',
    is_staff: capacites.length > 0,
    profile: {
      first_name: me.profile.first_name,
      last_name: me.profile.last_name,
      title: me.profile.title ?? undefined,
      phone: me.profile.phone ?? undefined,
      primary_parish: null,
      avatar: null,
    },
    diocese: null,
    province: null,
    capabilities: Array.from(new Set(capacites.map((c) => c.capacite))),
    etat_de_vie: me.etat_de_vie,
    degre_ordre: me.degre_ordre,
    statut_verification: me.statut_verification,
    paroisse_suivie: me.paroisse_suivie ?? null,
    mfa_required: mfaRequired,
  };
};

// Anciens mocks (tests des écrans V1 : appartenances, rôles) : la charge porte
// déjà un `role`. Le backend réel ne renvoie jamais ce champ.
const isLegacyUser = (data: unknown): data is User =>
  typeof data === 'object' &&
  data !== null &&
  typeof (data as { role?: unknown }).role === 'string';

const getCapacites = async (): Promise<{
  capacites: CapaciteMe[];
  mfaRequired: boolean;
}> => {
  try {
    const data = await api.get<unknown>('/v1/me/capacites/', { quiet: true });
    return {
      capacites: z.array(capaciteSchema).parse(data),
      mfaRequired: false,
    };
  } catch (e) {
    // 403 `mfa_required` : compte responsable connecté sans OTP. Il garde
    // l'accès fidèle ; les écrans staff proposent de se reconnecter.
    return {
      capacites: [],
      mfaRequired: e instanceof ApiError && e.code === 'mfa_required',
    };
  }
};

export const getUser = async (): Promise<User> => {
  const data = await api.get<unknown>('/v1/me/');
  if (isLegacyUser(data)) return data;
  const me = meSchema.parse(data);
  const { capacites, mfaRequired } = await getCapacites();
  return userFromMe(me, capacites, { mfaRequired });
};

export const userQueryKey = ['user'];

const hasSession = () =>
  typeof window !== 'undefined' && (!!getRefreshToken() || !!getAccessToken());

export const getUserQueryOptions = () =>
  queryOptions({
    queryKey: userQueryKey,
    queryFn: getUser,
    enabled: hasSession(),
    retry: false,
  });

export const useUser = () => useQuery(getUserQueryOptions());

// -----------------------------------------------------------------------------
// Connexion, inscription, déconnexion : Keycloak (voir oidc.ts)
// -----------------------------------------------------------------------------

type StartOptions = { redirectTo?: string | null; loginHint?: string };

/** Envoie le navigateur sur la page de connexion Keycloak. */
export const startLogin = async (options: StartOptions = {}) => {
  window.location.assign(await buildAuthorizationUrl(options));
};

/** Envoie le navigateur sur la page d'inscription Keycloak. */
export const startRegister = async (options: StartOptions = {}) => {
  window.location.assign(
    await buildAuthorizationUrl({ ...options, action: 'register' }),
  );
};

/** Oublie la session locale puis termine la session Keycloak (SSO). */
export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const idToken = readSession()?.id_token ?? null;
      clearSession();
      queryClient.clear();
      window.location.assign(buildEndSessionUrl(idToken));
    },
  });
};

// -----------------------------------------------------------------------------
// Suppression du compte : DELETE /v1/me/ (anonymisation, irréversible)
// -----------------------------------------------------------------------------

export const useDeleteAccount = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<unknown>('/v1/me/'),
    onSuccess: () => {
      const idToken = readSession()?.id_token ?? null;
      clearSession();
      queryClient.clear();
      onSuccess?.();
      window.location.assign(buildEndSessionUrl(idToken));
    },
  });
};
