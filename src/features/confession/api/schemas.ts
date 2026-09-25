import { z } from 'zod';

/** `SlotOutputSerializer` (apps/confessions/serializers.py). */
export const slotSchema = z.object({
  id: z.number(),
  starts_at: z.string(),
  ends_at: z.string(),
  status: z.enum(['libre', 'reserve', 'bloque']).optional(),
  place: z.object({
    id: z.number(),
    name: z.string(),
    address: z.string(),
    node_id: z.string(),
  }),
  priest_id: z.string(),
  priest_name: z.string(),
});
export type Slot = z.infer<typeof slotSchema>;

/** `BookingOutputSerializer` : délibérément SANS champ de contenu (RG-08). */
export const bookingSchema = z.object({
  id: z.number(),
  status: z.enum([
    'reservee',
    'annulee_fidele',
    'annulee_pretre',
    'honoree',
    'absent',
  ]),
  slot: slotSchema,
  cancel_message: z.string().optional().default(''),
  cancelled_at: z.string().nullable().optional(),
  can_cancel: z.boolean(),
  created_at: z.string().optional(),
});
export type Booking = z.infer<typeof bookingSchema>;

export const pageOf = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ count: z.number(), results: z.array(item) });
