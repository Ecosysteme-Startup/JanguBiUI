import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { paginatedSchema } from '@/lib/pagination';

// Confessions (apps/confessions) — contrat réel :
// GET  /v1/confessions/slots/?node=&place=&date_from=   créneaux libres, paginés
// POST /v1/confessions/bookings/ {slot_id}               → BookingOutput (201)
// POST /v1/confessions/bookings/<id>/cancel/             → BookingOutput
// GET  /v1/me/confession-bookings/                        mes rendez-vous, paginés

export const slotSchema = z.object({
  id: z.number(),
  starts_at: z.string(),
  ends_at: z.string(),
  status: z.string().default('libre'),
  place: z.object({
    id: z.number(),
    name: z.string(),
    address: z.string().default(''),
    node_id: z.string(),
  }),
  priest_id: z.string(),
  priest_name: z.string(),
});
export type ConfessionSlot = z.infer<typeof slotSchema>;

export const bookingStatusSchema = z.enum([
  'reservee',
  'annulee_fidele',
  'annulee_pretre',
  'honoree',
  'absent',
]);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const bookingSchema = z.object({
  id: z.number(),
  status: bookingStatusSchema,
  slot: slotSchema,
  cancel_message: z.string().default(''),
  cancelled_at: z.string().nullable().optional(),
  can_cancel: z.boolean(),
  created_at: z.string().optional(),
});
export type ConfessionBooking = z.infer<typeof bookingSchema>;

const slotsPageSchema = paginatedSchema(slotSchema);
const bookingsPageSchema = paginatedSchema(bookingSchema);

export const SLOTS_PAGE_SIZE = 30;

export type SlotsParams = {
  /** Paroisse (et ses lieux) ; sans filtre, tous les créneaux visibles. */
  node?: string;
  place?: number;
  date_from?: string;
};

export const getSlots = (params: SlotsParams & { offset?: number } = {}) =>
  api
    .get<unknown>('/v1/confessions/slots/', {
      params: { limit: SLOTS_PAGE_SIZE, ...params },
    })
    .then((d) => slotsPageSchema.parse(d));

export const useInfiniteSlots = (params: SlotsParams = {}) =>
  useInfiniteQuery(
    infiniteQueryOptions({
      queryKey: ['confessions', 'slots', params],
      queryFn: ({ pageParam }) => getSlots({ ...params, offset: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (last) =>
        last.next ? last.offset + last.results.length : undefined,
    }),
  );

export const getMyBookings = () =>
  api
    .get<unknown>('/v1/me/confession-bookings/', { params: { limit: 50 } })
    .then((d) => bookingsPageSchema.parse(d));

export const myBookingsQueryOptions = () =>
  queryOptions({
    queryKey: ['confessions', 'mine'],
    queryFn: getMyBookings,
  });

export const useMyBookings = () => useQuery(myBookingsQueryOptions());

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: ['confessions'] });
};

export const bookSlot = (slotId: number) =>
  api
    .post<unknown>(
      '/v1/confessions/bookings/',
      { slot_id: slotId },
      { quiet: true },
    )
    .then((d) => bookingSchema.parse(d));

export const useBookSlot = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: bookSlot, onSuccess: () => invalidate(qc) });
};

export const cancelBooking = (bookingId: number) =>
  api
    .post<unknown>(`/v1/confessions/bookings/${bookingId}/cancel/`, undefined, {
      quiet: true,
    })
    .then((d) => bookingSchema.parse(d));

export const useCancelBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => invalidate(qc),
  });
};

/** Codes V1 des refus → message sobre. */
export const messageConfession = (code: string | null | undefined): string => {
  switch (code) {
    case 'slot_taken':
      return 'Ce créneau vient d’être pris. Choisissez-en un autre.';
    case 'slot_past':
      return 'Ce créneau est passé.';
    case 'too_many_bookings':
      return 'Vous avez déjà des rendez-vous à venir : annulez-en un pour en prendre un autre.';
    case 'own_slot':
      return 'Vous ne pouvez pas réserver votre propre créneau.';
    case 'cancel_too_late':
      return 'L’annulation est possible jusqu’à une heure avant le rendez-vous.';
    case 'booking_not_active':
      return 'Ce rendez-vous n’est plus actif.';
    default:
      return 'L’opération n’a pas pu aboutir. Réessayez dans quelques instants.';
  }
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  reservee: 'Réservé',
  annulee_fidele: 'Annulé par vous',
  annulee_pretre: 'Annulé par le prêtre',
  honoree: 'Honoré',
  absent: 'Absent',
};
