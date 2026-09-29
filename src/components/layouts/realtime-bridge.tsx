'use client';

import { useUser } from '@/lib/auth';
import { useNotificationsSocket } from '@/lib/realtime/use-notifications-socket';

/**
 * Temps réel de l'application : une socket `ws/notifications/` par onglet,
 * ouverte dès qu'un compte est connecté (notifications, présence, battement).
 */
export function RealtimeBridge() {
  const { data: user } = useUser();
  useNotificationsSocket(!!user?.id);
  return null;
}
