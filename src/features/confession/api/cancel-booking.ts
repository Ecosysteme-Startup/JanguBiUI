import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type Booking, bookingSchema } from './schemas';

export const cancelBooking = async (bookingId: number): Promise<Booking> =>
  bookingSchema.parse(
    await api.post(`/confessions/bookings/${bookingId}/cancel/`),
  );

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelBooking,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ['confession'] }),
  });
};
