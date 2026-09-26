import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { eventSchema, type ParishEvent } from './get-events';

export const getEvent = async (id: string): Promise<ParishEvent> => eventSchema.parse(await api.get(`/agenda/${encodeURIComponent(id)}/`));

export const eventQueryOptions = (id: string) => queryOptions({ queryKey: ['agenda', id], queryFn: () => getEvent(id) });

export const useEvent = (id: string) => useQuery(eventQueryOptions(id));

export type RegisterBody = RequestBody<'v1_agenda_register_create'>;

/**
 * Inscription ou mise à jour de la sienne (`body` : nombre de personnes, remarque),
 * ou désinscription (`body = null`, 204). 400 si clos, 409 si complet ou places insuffisantes.
 */
export const setEventRegistration = async ({ id, body }: { id: string; body: RegisterBody | null }): Promise<ParishEvent | null> => {
  const path = `/agenda/${encodeURIComponent(id)}/register/`;
  if (body === null) {
    await api.delete(path);
    return null;
  }
  return eventSchema.parse(await api.post(path, body));
};

export const useEventRegistration = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterBody | null) => setEventRegistration({ id, body }),
    onSuccess: async (event) => {
      if (event) queryClient.setQueryData(eventQueryOptions(id).queryKey, event);
      await queryClient.invalidateQueries({ queryKey: ['agenda', id] });
      await queryClient.invalidateQueries({ queryKey: ['paroisse'] });
    },
  });
};
