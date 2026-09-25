import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { placeScheduleKey, type Schedule, scheduleSchema } from './get-place-schedule';

type ReplaceBody = RequestBody<'v1_hierarchy_places_schedule_update'>;
/** L'identifiant est en lecture seule : le serveur recrée toute la semaine. */
export type ScheduleItem = Omit<ReplaceBody['items'][number], 'id'>;

export const toItem = ({ id: _id, ...item }: Schedule): ScheduleItem => item;

/** Remplace la semaine type complète d'un lieu (PUT, horaires.gerer). */
export const replacePlaceSchedule = async (placeId: number, items: ScheduleItem[]): Promise<Schedule[]> => {
  const body = { items } satisfies { items: ScheduleItem[] };
  return z.array(scheduleSchema).parse(await api.put(`/hierarchy/places/${placeId}/schedule/`, body));
};

export const useReplacePlaceSchedule = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ placeId, items }: { placeId: number; items: ScheduleItem[] }) => replacePlaceSchedule(placeId, items),
    onSuccess: async (saved, { placeId }) => {
      queryClient.setQueryData(placeScheduleKey(placeId), saved);
      await queryClient.invalidateQueries({ queryKey: ['public'] });
      onSuccess?.();
    },
  });
};
