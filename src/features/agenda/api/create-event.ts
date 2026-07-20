import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { Event, eventSchema } from './get-events';

export type CreateEventInput = {
  title: string;
  description: string;
  event_type: string;
  start_at: string;
  end_at: string;
  location: string;
  max_participants?: number | null;
  /**
   * Portée territoriale. À défaut, le backend applique `global`, réservé aux
   * administrateurs province/national — un curé recevait donc un 400
   * systématique. Cf. `../utils/event-scopes`.
   */
  scope_type?: 'parish' | 'diocese' | 'church' | 'global';
  /** Id de la paroisse ou du diocèse visé, désambiguïsé par `scope_type`. */
  scope_id?: number | null;
  scope_church_id?: number | null;
};

export const useCreateEvent = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventInput): Promise<Event> =>
      api
        .post<unknown>('/v1/agenda/events/', data)
        .then((res) => eventSchema.parse(res)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onSuccess?.();
    },
  });
};
