import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import {
  api,
  clearAccessToken,
  clearRefreshToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from './api-client';

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
  // `plateforme.admin`…) si /me les expose. Absentes → repli sur les rôles.
  capabilities?: string[];
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export const getUser = async (): Promise<User> => {
  return api.get('/v1/auth/me/');
};

const userQueryKey = ['user'];

export const getUserQueryOptions = () => {
  const hasToken = typeof window !== 'undefined' ? !!getRefreshToken() : false;
  return queryOptions({
    queryKey: userQueryKey,
    queryFn: getUser,
    enabled: hasToken,
    retry: false,
  });
};

export const useUser = () => useQuery(getUserQueryOptions());

export const useLogin = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginWithEmailAndPassword,
    onSuccess: (data) => {
      if (data.access) setAccessToken(data.access);
      if (data.refresh) setRefreshToken(data.refresh);
      queryClient.setQueryData(userQueryKey, data.user);
      onSuccess?.();
    },
  });
};

export const useRegister = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerWithEmailAndPassword,
    onSuccess: (data) => {
      if (data?.user) {
        queryClient.setQueryData(userQueryKey, data.user);
      }
      onSuccess?.();
    },
  });
};

export const useLogout = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearAccessToken();
      clearRefreshToken();
      queryClient.clear();
      onSuccess?.();
    },
  });
};

const logout = (): Promise<void> => {
  const refresh = getRefreshToken();
  return api.post('/v1/auth/jwt/logout/', refresh ? { refresh } : undefined);
};

export const useLogoutAll = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>('/v1/auth/jwt/logout-all/'),
    onSuccess: () => {
      clearAccessToken();
      clearRefreshToken();
      queryClient.removeQueries({ queryKey: userQueryKey });
      onSuccess?.();
    },
  });
};

export const loginInputSchema = z.object({
  email: z.string().min(1, 'Requis').email('Email invalide'),
  password: z.string().min(1, 'Requis'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

const loginWithEmailAndPassword = (data: LoginInput): Promise<AuthResponse> => {
  return api.post('/v1/auth/jwt/login/', data);
};

export const registerInputSchema = z
  .object({
    email: z.string().min(1, 'Requis').email('Email invalide'),
    phone_number: z.string().min(1, 'Requis'),
    first_name: z.string().min(1, 'Requis'),
    last_name: z.string().min(1, 'Requis'),
    title: z.enum(['MR', 'MRS'], {
      required_error: 'Requis',
      invalid_type_error: 'Civilité invalide',
    }),
    password: z.string().min(8, 'Minimum 8 caractères'),
    confirmPassword: z.string().min(1, 'Requis'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerInputSchema>;

const registerWithEmailAndPassword = (
  data: RegisterInput,
): Promise<AuthResponse> => {
  // Strip confirmPassword before sending to backend.
  const { confirmPassword: _confirmPassword, ...payload } = data;
  void _confirmPassword;
  return api.post('/v1/users/register/', payload);
};

// -----------------------------------------------------------------------------
// Password reset
// -----------------------------------------------------------------------------

export type RequestPasswordResetInput = { email: string };

export const useRequestPasswordReset = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) =>
  useMutation({
    mutationFn: (data: RequestPasswordResetInput) =>
      api.post<unknown>('/v1/users/password/reset/request/', data),
    onSuccess,
  });

export type ConfirmPasswordResetInput = {
  token: string;
  new_password: string;
};

export const useConfirmPasswordReset = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) =>
  useMutation({
    mutationFn: (data: ConfirmPasswordResetInput) =>
      api.post<unknown>('/v1/users/password/reset/confirm/', data),
    onSuccess,
  });

// -----------------------------------------------------------------------------
// Email verification
// -----------------------------------------------------------------------------

export type VerifyEmailInput = { token: string };

export const useVerifyEmail = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) =>
  useMutation({
    mutationFn: (data: VerifyEmailInput) =>
      api.post<unknown>('/v1/users/verify-email/', data),
    onSuccess,
  });

// -----------------------------------------------------------------------------
// Account deletion
// -----------------------------------------------------------------------------

export const useDeleteAccount = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<unknown>('/v1/users/me/delete/'),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: userQueryKey });
      onSuccess?.();
    },
  });
};

// -----------------------------------------------------------------------------
// Email change flow
// -----------------------------------------------------------------------------

export type RequestEmailChangeInput = {
  new_email: string;
  current_password: string;
};

export const useRequestEmailChange = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) =>
  useMutation({
    mutationFn: (data: RequestEmailChangeInput) =>
      api.post<unknown>('/v1/users/email/change/request/', data),
    onSuccess,
  });

export type ConfirmEmailChangeInput = { otp_code: string };

export const useConfirmEmailChange = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConfirmEmailChangeInput) =>
      api.post<unknown>('/v1/users/email/change/confirm/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKey });
      onSuccess?.();
    },
  });
};
