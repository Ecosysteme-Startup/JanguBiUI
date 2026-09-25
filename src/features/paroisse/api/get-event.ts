import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { eventSchema, type ParishEvent } from './get-events';

export const getEvent = async (id: string): Promise<ParishEvent> => eventSchema.parse(await api.get(`/agenda/${encodeURIComponent(id)}/`));

export const eventQueryOptions = (id: string) => queryOptions({ queryKey: ['agenda', id], queryFn: () => getEvent(id) });

export const useEvent = (id: string) => useQuery(eventQueryOptions(id));

/** Inscription (idempotente ; 409 si complet) ou désinscription (204). */
export const setEventRegistration = async ({ id, register }: { id: string; register: boolean }): Promise<ParishEvent | null> => {
  const path = `/agenda/${encodeURIComponent(id)}/register/`;
  if (!register) {
    await api.delete(path);
    return null;
  }
  return eventSchema.parse(await api.post(path));
};

export const useEventRegistration = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (register: boolean) => setEventRegistration({ id, register }),
    onSuccess: async (event) => {
      if (event) queryClient.setQueryData(eventQueryOptions(id).queryKey, event);
      await queryClient.invalidateQueries({ queryKey: ['agenda', id] });
      await queryClient.invalidateQueries({ queryKey: ['paroisse'] });
    },
  });
};
