import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { useUser } from '@/lib/auth';
import { useRealtimeStore } from '@/stores/realtime-store';

const notificationSchema = z.object({
  id: z.string(),
  event_type: z.string(),
  payload: z.record(z.unknown()),
  is_read: z.boolean(),
  read_at: z.string().nullable(),
  created_at: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;

const parseNotifications = (data: unknown): Notification[] => {
  if (!Array.isArray(data)) return [];
  return data.map((item) => notificationSchema.parse(item));
};

export const getNotifications = (): Promise<Notification[]> =>
  api.get<unknown>('/v1/messaging/notifications/').then(parseNotifications);

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
      api.post<unknown>(`/v1/messaging/notifications/${notificationId}/read/`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
