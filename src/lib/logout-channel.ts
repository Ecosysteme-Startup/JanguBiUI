/**
 * Propagation de la déconnexion entre les onglets. Quand un onglet se déconnecte, les autres
 * doivent basculer vers l'accueil et vider leur cache (plus aucune donnée de la session close).
 *
 * On diffuse via `BroadcastChannel` quand il existe, avec repli sur l'événement `storage`
 * (localStorage) pour les navigateurs qui ne l'ont pas. Un identifiant d'onglet évite que l'onglet
 * émetteur ne traite son propre message (il poursuit, lui, la fin de session Keycloak).
 */
const CHANNEL = 'jangubi-auth';
const STORAGE_KEY = 'jangubi-logout';
const LOGOUT = 'logout';

/** Identifiant de cet onglet (module chargé une fois par onglet). */
const TAB_ID = Math.random().toString(36).slice(2);

type LogoutMessage = { type: typeof LOGOUT; from: string };

export const broadcastLogout = (): void => {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(CHANNEL);
      channel.postMessage({ type: LOGOUT, from: TAB_ID } satisfies LogoutMessage);
      channel.close();
    }
  } catch {
    // BroadcastChannel indisponible : on compte sur le repli storage.
  }
  try {
    // L'événement `storage` ne se déclenche que dans les AUTRES onglets (pas l'émetteur).
    localStorage.setItem(STORAGE_KEY, `${TAB_ID}:${Date.now()}`);
  } catch {
    // stockage indisponible (navigation privée, blocage) : rien de plus à faire.
  }
};

/** S'abonne aux déconnexions des autres onglets. Renvoie une fonction de désabonnement. */
export const onLogoutBroadcast = (handler: () => void): (() => void) => {
  const cleanups: Array<() => void> = [];
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(CHANNEL);
      const listener = (event: MessageEvent<LogoutMessage>) => {
        if (event.data?.type === LOGOUT && event.data.from !== TAB_ID) handler();
      };
      channel.addEventListener('message', listener);
      cleanups.push(() => {
        channel.removeEventListener('message', listener);
        channel.close();
      });
    }
  } catch {
    // ignore
  }
  try {
    const storageListener = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue && !event.newValue.startsWith(`${TAB_ID}:`)) handler();
    };
    window.addEventListener('storage', storageListener);
    cleanups.push(() => window.removeEventListener('storage', storageListener));
  } catch {
    // ignore
  }
  return () => cleanups.forEach((cleanup) => cleanup());
};
