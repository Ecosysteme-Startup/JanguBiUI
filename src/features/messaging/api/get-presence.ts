import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { type Presence, useRealtimeStore } from '@/stores/realtime-store';

// GET /v1/messaging/presence/?users=<uuid>,<uuid> (backend TEMPS-REEL §2.4) :
// état des interlocuteurs à l'ouverture d'une liste ou d'une conversation,
// 50 au plus. Seuls les interlocuteurs figurent dans la réponse ; les
// changements arrivent ensuite par `presence.changed` (socket).

export const PRESENCE_MAX_USERS = 50;

const presenceSchema = z.object({
  user_id: z.string(),
  visible: z.boolean(),
  online: z.boolean().nullable(),
  last_seen_at: z.string().nullable(),
});

export const getPresence = (users: string[]): Promise<Presence[]> =>
  api
    .get<unknown>(
      `/v1/messaging/presence/?users=${users.map(encodeURIComponent).join(',')}`,
    )
    .then((d) => z.array(presenceSchema).parse(d));

/**
 * Présence des personnes données, tenue à jour par la socket. Une personne
 * absente de la réponse (pas un interlocuteur, présence masquée) n'a pas
 * d'entrée : on n'affiche rien.
 */
export const usePresence = (userIds: string[]) => {
  const ids = Array.from(new Set(userIds.filter(Boolean)))
    .sort()
    .slice(0, PRESENCE_MAX_USERS);
  const setPresences = useRealtimeStore((s) => s.setPresences);
  const query = useQuery({
    queryKey: ['messaging', 'presence', ids],
    queryFn: () => getPresence(ids),
    enabled: ids.length > 0,
    retry: false,
    staleTime: 60_000,
  });
  useEffect(() => {
    if (query.data) setPresences(query.data);
  }, [query.data, setPresences]);
  return useRealtimeStore((s) => s.presences);
};
