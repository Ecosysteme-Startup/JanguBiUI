import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

/** Rendez-vous de confession (`BookingOutputSerializer`) : délibérément SANS champ de contenu (RG-08). */
const bookingSchema = z.object({
  id: z.number(),
  status: z.string(),
  slot: z.object({
    starts_at: z.string(),
    ends_at: z.string(),
    priest_name: z.string(),
    place: z.object({ name: z.string(), node_id: z.string() }).passthrough(),
  }).passthrough(),
});
export type ConfessionBooking = z.infer<typeof bookingSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(bookingSchema) });

/** Mes rendez-vous de confession, pour afficher le prochain sur « Ma paroisse ». */
export const getMyConfessionBookings = async (): Promise<ConfessionBooking[]> =>
  pageSchema.parse(await api.get('/me/confession-bookings/', { params: { limit: 20 } })).results;

export const myConfessionBookingsQueryOptions = () =>
  queryOptions({ queryKey: ['confession', 'mes-rendez-vous', 'paroisse'], queryFn: getMyConfessionBookings });

export const useMyConfessionBookings = () => useQuery(myConfessionBookingsQueryOptions());

/** Prochain rendez-vous réservé (à venir), le plus proche d'abord. */
export const nextBooking = (bookings: ConfessionBooking[] | undefined, now: Date = new Date()) =>
  bookings
    ?.filter((b) => b.status === 'reservee' && new Date(b.slot.starts_at) >= now)
    .sort((a, b) => new Date(a.slot.starts_at).getTime() - new Date(b.slot.starts_at).getTime())[0];
