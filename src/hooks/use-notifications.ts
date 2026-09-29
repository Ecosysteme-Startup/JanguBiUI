import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { useUser } from '@/lib/auth';
import { useRealtimeStore } from '@/stores/realtime-store';

// Centre de notifications — routes canoniques apps/messaging urls_notifications :
// GET /v1/notifications/ (liste plate, ?unread_only=), POST /<id>/read/,
// POST /read-all/, GET /unread-count/ → {unread}.
const notificationSchema = z.object({
  id: z.string(),
  event_type: z.string(),
  payload: z.record(z.unknown()).nullable().default({}),
  is_read: z.boolean(),
  read_at: z.string().nullable(),
  created_at: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;

const parseNotifications = (data: unknown): Notification[] =>
  z.array(notificationSchema).parse(Array.isArray(data) ? data : []);

export const getNotifications = (): Promise<Notification[]> =>
  api.get<unknown>('/v1/notifications/').then(parseNotifications);

/** Polling de secours : seulement quand la socket `ws/notifications/` est fermée. */
export const NOTIFICATIONS_POLLING_MS = 30_000;

export const useNotifications = () => {
  const { data: user } = useUser();
  const socketOuverte = useRealtimeStore(
    (s) => s.notificationsSocket === 'ouverte',
  );
  return useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    // Temps réel par `ws/notifications/` ; sans socket, polling toutes les 30 s.
    refetchInterval: socketOuverte ? false : NOTIFICATIONS_POLLING_MS,
    enabled: !!user?.id,
    retry: false,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      api.post<unknown>(`/v1/notifications/${notificationId}/read/`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

/** `POST /v1/notifications/read-all/` → `{unread: 0}`. */
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<unknown>('/v1/notifications/read-all/'),
    onSuccess: () => {
      queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
        old?.map((n) => ({
          ...n,
          is_read: true,
          read_at: n.read_at ?? new Date().toISOString(),
        })),
      );
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
