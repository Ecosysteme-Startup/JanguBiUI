import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { Expect, Matches, RequestBody, ResponseBody } from '@/types/api-contract';

export const EVENT_TYPES = ['mass', 'conference', 'retreat', 'ordination', 'other'] as const;
export const EVENT_TYPE_LABELS: Record<(typeof EVENT_TYPES)[number], string> = {
  mass: 'Messe',
  conference: 'Conférence',
  retreat: 'Retraite, récollection',
  ordination: 'Ordination',
  other: 'Autre',
};

export const staffEventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  event_type: z.enum(EVENT_TYPES),
  start_at: z.string(),
  end_at: z.string(),
  location: z.string(),
  node_id: z.string().nullable(),
  node_name: z.string().nullable(),
  place_id: z.number().nullable(),
  max_participants: z.number().nullable(),
  registration_closes_at: z.string().nullable(),
  registrations_count: z.number(),
  /** Places réservées (somme des personnes de chaque inscription) : c'est elle que la jauge compte. */
  seats_taken: z.number(),
  seats_remaining: z.number().nullable(),
  is_full: z.boolean(),
  is_cancelled: z.boolean(),
});
export type StaffEvent = z.infer<typeof staffEventSchema>;

type _EventKeys = Expect<Matches<Exclude<keyof StaffEvent, keyof ResponseBody<'v1_staff_agenda_retrieve'>>, never>>;

const pageSchema = z.object({ count: z.number(), results: z.array(staffEventSchema) });
const eventsKey = ['staff', 'agenda'] as const;

/** Plafond de la pagination serveur (max_limit = 50). */
const MAX_LIMIT = 50;
/** Garde-fou : au-delà, la période est trop large pour un écran d'agenda. */
const MAX_PAGES = 20;

export type EventPeriod = { from: string; to: string };

/**
 * Événements du nœud dont une partie tombe dans la période (jours inclus, passé compris),
 * triés par début. Les pages de 50 sont enchaînées : un mois chargé dépasse parfois 50 événements.
 */
export const getStaffEvents = async (nodeId: string, period: EventPeriod) => {
  const first = pageSchema.parse(await api.get('/staff/agenda/', { params: { node: nodeId, ...period, limit: MAX_LIMIT, offset: 0 } }));
  const pages = Math.min(MAX_PAGES, Math.ceil(first.count / MAX_LIMIT));
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) =>
      api.get('/staff/agenda/', { params: { node: nodeId, ...period, limit: MAX_LIMIT, offset: (i + 1) * MAX_LIMIT } }).then((r) => pageSchema.parse(r)),
    ),
  );
  return { count: first.count, results: [...first.results, ...rest.flatMap((p) => p.results)] };
};

export const staffEventsQueryOptions = (nodeId: string, period: EventPeriod) =>
  queryOptions({ queryKey: [...eventsKey, nodeId, period], queryFn: () => getStaffEvents(nodeId, period) });

export const useStaffEvents = (nodeId: string, period: EventPeriod) => useQuery(staffEventsQueryOptions(nodeId, period));

export type EventCreateBody = RequestBody<'v1_staff_agenda_create'>;
export type EventUpdateBody = RequestBody<'v1_staff_agenda_partial_update'>;

export const createEvent = async (body: EventCreateBody) => staffEventSchema.parse(await api.post('/staff/agenda/', body));
export const updateEvent = async (id: number, body: EventUpdateBody) => staffEventSchema.parse(await api.patch(`/staff/agenda/${id}/`, body));
/** Annulation (DELETE) : l'événement reste visible comme annulé, les inscrits sont prévenus. */
export const cancelEvent = (id: number): Promise<void> => api.delete(`/staff/agenda/${id}/`);

export type SaveEventInput = { id: null; body: EventCreateBody } | { id: number; body: EventUpdateBody };

const useInvalidateEvents = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: eventsKey });
};

export const useSaveEvent = ({ onSuccess }: { onSuccess?: (event: StaffEvent) => void } = {}) => {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: (input: SaveEventInput) => (input.id === null ? createEvent(input.body) : updateEvent(input.id, input.body)),
    onSuccess: async (event) => {
      await invalidate();
      onSuccess?.(event);
    },
  });
};

export const useCancelEvent = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: cancelEvent,
    onSuccess: async () => {
      await invalidate();
      onSuccess?.();
    },
  });
};
