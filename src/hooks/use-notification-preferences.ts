import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

/** Préférences de notification (EF-PAROI-08) : canaux, sujets, plage de silence. */
const preferencesSchema = z.object({
  in_app: z.boolean(),
  email: z.boolean(),
  topic_annonces: z.boolean(),
  topic_evenements: z.boolean(),
  quiet_start: z.string(),
  quiet_end: z.string(),
});
export type NotificationPreferences = z.infer<typeof preferencesSchema>;
export type NotificationPreferencesInput = RequestBody<'v1_me_notification_preferences_update'>;

export const getNotificationPreferences = async (): Promise<NotificationPreferences> =>
  preferencesSchema.parse(await api.get('/me/notification-preferences/'));

export const updateNotificationPreferences = async (input: NotificationPreferencesInput): Promise<NotificationPreferences> =>
  preferencesSchema.parse(await api.put('/me/notification-preferences/', input));

export const notificationPreferencesQueryOptions = () =>
  queryOptions({ queryKey: ['me', 'notification-preferences'], queryFn: getNotificationPreferences });

export const useNotificationPreferences = () => useQuery(notificationPreferencesQueryOptions());

/** Mise à jour optimiste : l'interrupteur bascule tout de suite, et revient en cas d'échec. */
export const useUpdateNotificationPreferences = ({ onError }: { onError?: (error: Error) => void } = {}) => {
  const queryClient = useQueryClient();
  const key = notificationPreferencesQueryOptions().queryKey;
  return useMutation({
    mutationFn: updateNotificationPreferences,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      if (previous) queryClient.setQueryData(key, { ...previous, ...input });
      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      onError?.(error);
    },
    onSuccess: (data) => queryClient.setQueryData(key, data),
  });
};

/** Plage de silence : `start == end` signifie « pas de silence » (backend, quiet_hours.py). */
export const QUIET_DEFAULT = { quiet_start: '22:00:00', quiet_end: '06:00:00' } as const;
export const QUIET_NONE = { quiet_start: '00:00:00', quiet_end: '00:00:00' } as const;
export const isQuietEnabled = (p: Pick<NotificationPreferences, 'quiet_start' | 'quiet_end'>) => p.quiet_start !== p.quiet_end;
/** « 22:00:00 » → « 22 h » ; « 06:30:00 » → « 6 h 30 » */
export const quietHour = (value: string) => {
  const [h = '0', m = '00'] = value.split(':');
  return m === '00' ? `${Number(h)} h` : `${Number(h)} h ${m}`;
};
