import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

type CancelBody = RequestBody<'v1_staff_confessions_slots_cancel_create'>;

/** Le prêtre retire un de SES créneaux ; le réservant éventuel reçoit le message. */
export const cancelSlot = ({
  slotId,
  message,
}: {
  slotId: number;
  message: string;
}) => {
  const body: CancelBody = { message };
  return api.post(`/staff/confessions/slots/${slotId}/cancel/`, body);
};

export const useCancelSlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelSlot,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['confessions-planning'] }),
  });
};
