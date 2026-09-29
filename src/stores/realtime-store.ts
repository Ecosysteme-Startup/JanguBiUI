import { create } from 'zustand';

// État temps réel partagé par onglet (backend `docs/TEMPS-REEL.md` §2) :
// - l'état de la socket `ws/notifications/` (le polling des notifications ne
//   sert qu'en secours, quand elle n'est pas ouverte) ;
// - la présence des interlocuteurs, alimentée par `GET messaging/presence/`
//   puis par les événements `presence.changed`.

export type EtatSocket = 'inactive' | 'connexion' | 'ouverte' | 'reconnexion';

export type Presence = {
  user_id: string;
  /** `false` : présence masquée, on n'affiche rien. */
  visible: boolean;
  online: boolean | null;
  last_seen_at: string | null;
};

type RealtimeStore = {
  notificationsSocket: EtatSocket;
  setNotificationsSocket: (etat: EtatSocket) => void;
  presences: Record<string, Presence>;
  setPresences: (liste: Presence[]) => void;
};

export const useRealtimeStore = create<RealtimeStore>((set) => ({
  notificationsSocket: 'inactive',
  setNotificationsSocket: (etat) => set({ notificationsSocket: etat }),
  presences: {},
  setPresences: (liste) =>
    set((state) => {
      if (!liste.length) return state;
      const presences = { ...state.presences };
      liste.forEach((p) => {
        presences[p.user_id] = p;
      });
      return { presences };
    }),
}));

/** Trame `presence.changed` → état de présence (champs manquants tolérés). */
export const presenceDepuisTrame = (
  trame: Record<string, unknown>,
): Presence | null => {
  if (typeof trame.user_id !== 'string') return null;
  return {
    user_id: trame.user_id,
    visible: trame.visible === true,
    online: typeof trame.online === 'boolean' ? trame.online : null,
    last_seen_at:
      typeof trame.last_seen_at === 'string' ? trame.last_seen_at : null,
  };
};
