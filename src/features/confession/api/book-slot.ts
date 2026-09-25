import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { type Booking, bookingSchema } from './schemas';

type BookingBody = RequestBody<'v1_confessions_bookings_create'>;

/** Réservation : le créneau et rien d'autre (aucun motif, aucun texte — RG-08). */
export const bookSlot = async (slotId: number): Promise<Booking> => {
  const body: BookingBody = { slot_id: slotId };
  return bookingSchema.parse(await api.post('/confessions/bookings/', body));
};

export const useBookSlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookSlot,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ['confession'] }),
  });
};
