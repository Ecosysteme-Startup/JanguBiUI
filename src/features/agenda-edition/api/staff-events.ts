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
  registrations_count: z.number(),
  is_full: z.boolean(),
  is_cancelled: z.boolean(),
});
export type StaffEvent = z.infer<typeof staffEventSchema>;

type _EventKeys = Expect<Matches<Exclude<keyof StaffEvent, keyof ResponseBody<'v1_staff_agenda_retrieve'>>, never>>;

const pageSchema = z.object({ count: z.number(), results: z.array(staffEventSchema) });
const eventsKey = ['staff', 'agenda'] as const;

/** Plafond de la pagination serveur (max_limit = 50). */
const MAX_LIMIT = 50;

/**
 * Événements du nœud, triés par début. Sans `include_past`, le serveur ne renvoie que
 * les événements non terminés ; aucun filtre de dates n'existe côté staff.
 */
export const getStaffEvents = async (nodeId: string, includePast: boolean) =>
  pageSchema.parse(await api.get('/staff/agenda/', { params: { node: nodeId, include_past: includePast, limit: MAX_LIMIT } }));

export const staffEventsQueryOptions = (nodeId: string, includePast: boolean) =>
  queryOptions({ queryKey: [...eventsKey, nodeId, { includePast }], queryFn: () => getStaffEvents(nodeId, includePast) });

export const useStaffEvents = (nodeId: string, includePast: boolean) => useQuery(staffEventsQueryOptions(nodeId, includePast));

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
