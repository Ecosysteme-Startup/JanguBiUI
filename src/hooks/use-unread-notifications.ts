import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { useRealtimeStore } from '@/stores/realtime-store';

/** Secours quand la socket `ws/notifications/` n'est pas ouverte. */
export const UNREAD_POLL_MS = 30_000;

// Même clé et même forme que features/notifications/api/get-notifications.ts (cache partagé) :
// la coquille n'importe pas une feature, elle relit le cache `['notifications']`.
const notificationSchema = z.object({
  id: z.string(),
  event_type: z.string(),
  payload: z.record(z.string(), z.unknown()),
  is_read: z.boolean(),
  read_at: z.string().nullable(),
  created_at: z.string(),
});

const getNotifications = async () => z.array(notificationSchema).parse(await api.get('/notifications/'));

/**
 * Nombre de notifications non lues (pastille de la cloche). En direct, la socket de l'onglet
 * invalide `['notifications']` à chaque notification ; socket fermée ou hors ligne, la cloche se
 * recharge toutes les 30 s.
 */
export const useUnreadNotifications = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const socketOuverte = useRealtimeStore((s) => s.notificationsSocket === 'open');
  return useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled,
    refetchInterval: socketOuverte ? false : UNREAD_POLL_MS,
    select: (list) => list.filter((n) => !n.is_read).length,
  });
};
