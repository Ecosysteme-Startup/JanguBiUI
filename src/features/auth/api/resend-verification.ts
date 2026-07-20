import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export type ResendVerificationInput = {
  email: string;
};

/**
 * Renvoie le lien d'activation à un compte encore inactif.
 *
 * Sans cet appel, un testeur dont le lien a expiré (24 h) restait bloqué pour
 * toujours : la réinscription est refusée et le compte demeure `is_active=false`.
 *
 * La réponse est volontairement neutre côté serveur (anti-énumération) : elle ne
 * dit jamais si l'adresse correspond à un compte.
 */
export const resendVerification = (data: ResendVerificationInput) =>
  api.post<{ detail: string }>('/v1/users/verify-email/resend/', data);

export const useResendVerification = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) =>
  useMutation({
    mutationFn: resendVerification,
    onSuccess: () => onSuccess?.(),
  });
