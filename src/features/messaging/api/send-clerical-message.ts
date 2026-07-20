import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { clergicalMessageSchema, ClergicalMessage } from './get-clerical-inbox';

export type SendClericalMessageInput = {
  subject: string;
  body: string;
  recipient_scope: string;
  scope_id?: number | null;
  /** UUID de BaseUser (`priest.user_id`) — pas la PK entière de PriestProfile. */
  individual_recipient_id?: string | null;
};

export const useSendClericalMessage = ({
  onSuccess,
}: { onSuccess?: (msg: ClergicalMessage) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendClericalMessageInput) =>
      api
        .post<unknown>('/v1/messaging/clerical/', data)
        .then((res) => clergicalMessageSchema.parse(res)),
    onSuccess: (msg) => {
      queryClient.invalidateQueries({ queryKey: ['clerical-inbox'] });
      onSuccess?.(msg);
    },
  });
};
