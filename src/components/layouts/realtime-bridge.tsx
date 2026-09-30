'use client';

import { useMe } from '@/hooks/use-me';
import { useNotificationsSocket } from '@/lib/realtime/use-notifications-socket';

/**
 * Temps réel de l'onglet : une socket `ws/notifications/`, ouverte dès qu'un compte est connecté
 * (notifications, présence, battement, synchronisation du lecteur). Monté par `AppFrame`, donc une
 * fois par shell authentifié (espace fidèle, back-office, plateforme).
 */
export const RealtimeBridge = () => {
  const { data: me } = useMe();
  useNotificationsSocket(Boolean(me?.id));
  return null;
};
