import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type ConsentStatus, consentStatusSchema } from './get-consent';

type ParoisseBody = RequestBody<'v1_me_paroisse_suivie_update'>;
type ConsentBody = RequestBody<'v1_me_consent_create'>;
type PreferencesBody = RequestBody<'v1_me_notification_preferences_update'>;

export type OnboardingInput = { nodeId: string; consentVersion: string; annonces: boolean };

/**
 * Étapes 2 et 3 : paroisse suivie, puis consentement exprès (loi 2008-12), puis préférence
 * facultative. Le consentement est enregistré en dernier : sans paroisse, pas de consentement.
 */
export const completeOnboarding = async ({ nodeId, consentVersion, annonces }: OnboardingInput): Promise<ConsentStatus> => {
  const paroisse: ParoisseBody = { node_id: nodeId };
  await api.put('/me/paroisse-suivie/', paroisse);
  const consent: ConsentBody = { version: consentVersion };
  const status = consentStatusSchema.parse(await api.post('/me/consent/', consent));
  const preferences: PreferencesBody = { topic_annonces: annonces };
  await api.put('/me/notification-preferences/', preferences);
  return status;
};

export const useCompleteOnboarding = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      onSuccess?.();
    },
  });
};
