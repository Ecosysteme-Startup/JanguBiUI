import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

/** Consentement exprès à la version en vigueur des conditions (loi 2008-12). */
export const giveConsent = (version: string) => {
  const body: RequestBody<'v1_me_consent_create'> = { version };
  return api.post('/me/consent/', body);
};

export const useGiveConsent = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: giveConsent, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }) });
};
