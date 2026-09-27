import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

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

/** Nombre de notifications non lues (pastille de la cloche). */
export const useUnreadNotifications = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled,
    select: (list) => list.filter((n) => !n.is_read).length,
  });
