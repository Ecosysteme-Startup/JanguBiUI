import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type Event, eventSchema } from './get-events';

export type RegisterEventInput = {
  eventId: number;
  /** Places réservées (1 par défaut). */
  seats?: number;
  note?: string;
};

/** `POST /v1/agenda/<id>/register/` → l'événement à jour (201). */
export const registerEvent = ({
  eventId,
  seats = 1,
  note,
}: RegisterEventInput): Promise<Event> =>
  api
    .post<unknown>(
      `/v1/agenda/${eventId}/register/`,
      note ? { seats, note } : { seats },
      // Le refus (complet, clos…) est expliqué par l'écran.
      { quiet: true },
    )
    .then((data) => eventSchema.parse(data));

export const useRegisterEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: number | RegisterEventInput) =>
      registerEvent(typeof input === 'number' ? { eventId: input } : input),
    onSuccess: (event) => {
      queryClient.setQueryData(['event', event.id], event);
      void queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};
