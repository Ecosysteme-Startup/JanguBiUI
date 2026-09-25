import { z } from 'zod';

export const placeBriefSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string(),
  node_id: z.string(),
});

/**
 * `PlanningSlotSerializer` : `booking.person` est le nom complet pour le prêtre du créneau,
 * les initiales pour le secrétariat (le serveur décide ; le front n'affiche que ce qu'il reçoit).
 */
export const planningSlotSchema = z.object({
  id: z.number(),
  starts_at: z.string(),
  ends_at: z.string(),
  status: z.enum(['libre', 'reserve', 'bloque']),
  place: placeBriefSchema,
  priest_id: z.string(),
  priest_name: z.string(),
  is_mine: z.boolean(),
  booking: z
    .object({ id: z.number(), status: z.string(), person: z.string() })
    .nullable(),
});
export type PlanningSlot = z.infer<typeof planningSlotSchema>;

export const ruleSchema = z.object({
  id: z.number(),
  place: placeBriefSchema,
  weekday: z.number(),
  start_time: z.string(),
  end_time: z.string(),
  slot_minutes: z.number(),
  valid_from: z.string().nullable().optional(),
  valid_to: z.string().nullable().optional(),
  is_active: z.boolean().optional().default(true),
});
export type Rule = z.infer<typeof ruleSchema>;

export const placeSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  name: z.string(),
  kind: z.string().optional(),
  is_main: z.boolean().optional(),
  is_active: z.boolean().optional().default(true),
});
export type Place = z.infer<typeof placeSchema>;
