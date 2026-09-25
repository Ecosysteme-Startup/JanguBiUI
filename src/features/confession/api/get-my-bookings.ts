import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { type Booking, bookingSchema, pageOf } from './schemas';

export const getMyBookings = async (): Promise<Booking[]> =>
  pageOf(bookingSchema).parse(
    await api.get('/me/confession-bookings/', { params: { limit: 20 } }),
  ).results;

export const myBookingsQueryOptions = () =>
  queryOptions({
    queryKey: ['confession', 'mes-rendez-vous'],
    queryFn: getMyBookings,
  });

export const useMyBookings = () => useQuery(myBookingsQueryOptions());
