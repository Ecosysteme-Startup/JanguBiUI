import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const notificationSchema = z.object({
  id: z.string(),
  event_type: z.string(),
  payload: z.record(z.string(), z.unknown()),
  is_read: z.boolean(),
  read_at: z.string().nullable(),
  created_at: z.string(),
});
export type AppNotification = z.infer<typeof notificationSchema>;

/** Toutes mes notifications, récentes d'abord (l'API renvoie une liste, sans pagination). */
export const getNotifications = async (): Promise<AppNotification[]> =>
  z.array(notificationSchema).parse(await api.get('/notifications/'));

export const notificationsQueryOptions = () => queryOptions({ queryKey: ['notifications'], queryFn: getNotifications });

export const useNotifications = () => useQuery(notificationsQueryOptions());

export const markNotificationRead = (id: string) => api.post(`/notifications/${encodeURIComponent(id)}/read/`);

export const markAllNotificationsRead = () => api.post('/notifications/read-all/');

/** Lecture optimiste : la pastille disparaît tout de suite. */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  const key = notificationsQueryOptions().queryKey;
  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: (id: string) => {
      queryClient.setQueryData(key, (list) => list?.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  const key = notificationsQueryOptions().queryKey;
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.setQueryData(key, (list) => list?.map((n) => ({ ...n, is_read: true })));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
};
