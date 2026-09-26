import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

// Doublon assumé de la feature `confession` : `BookingOutputSerializer`, sans aucun champ de contenu (RG-08).
const bookingSchema = z.object({
  id: z.number(),
  status: z.string(),
  slot: z.object({
    starts_at: z.string(),
    ends_at: z.string(),
    place: z.object({ name: z.string(), address: z.string() }).passthrough(),
    priest_name: z.string(),
  }),
});
export type HomeBooking = z.infer<typeof bookingSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(bookingSchema) });

export const getMyBookings = async () => pageSchema.parse(await api.get('/me/confession-bookings/', { params: { limit: 20 } })).results;

export const myBookingsQueryOptions = () => queryOptions({ queryKey: ['accueil', 'confession'], queryFn: getMyBookings });

export const useMyBookings = () => useQuery(myBookingsQueryOptions());
