import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const registrationSchema = z.object({ id: z.number(), full_name: z.string(), email: z.string(), registered_at: z.string() });
export type Registration = z.infer<typeof registrationSchema>;

const pageSchema = z.object({ count: z.number(), results: z.array(registrationSchema) });

/** Les premiers inscrits (aperçu) ; la liste complète passe par l'export CSV. */
export const getEventRegistrations = async (eventId: number) =>
  pageSchema.parse(await api.get(`/staff/agenda/${eventId}/registrations/`, { params: { limit: 5 } }));

export const eventRegistrationsQueryOptions = (eventId: number) =>
  queryOptions({ queryKey: ['staff', 'agenda', eventId, 'registrations'], queryFn: () => getEventRegistrations(eventId) });

export const useEventRegistrations = (eventId: number) => useQuery(eventRegistrationsQueryOptions(eventId));

/** Télécharge le CSV des inscrits (le jeton ne peut pas passer par un simple lien). */
export const downloadRegistrationsCsv = async (eventId: number) => {
  const csv = await api.get<string>(`/staff/agenda/${eventId}/registrations.csv`);
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `inscrits-evenement-${eventId}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
