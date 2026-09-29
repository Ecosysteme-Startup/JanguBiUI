const KEY = 'jb_player_device_id';

let cached: string | null = null;

function randomId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // ignoré
  }
  // UUID v4 de secours (client_event_id doit être un UUID).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Identifiant stable de ce navigateur pour la reprise multi-appareils
 * (`device_id` du contrat). Préfixe `web-` : les autres appareils affichent
 * « un autre navigateur ». Stockage local ; à défaut, identifiant de session.
 */
export function getDeviceId(): string {
  if (cached) return cached;
  let id: string | null = null;
  try {
    id = localStorage.getItem(KEY);
  } catch {
    id = null;
  }
  if (!id) {
    id = `web-${randomId().slice(0, 12)}`;
    try {
      localStorage.setItem(KEY, id);
    } catch {
      // navigation privée : identifiant de session
    }
  }
  cached = id;
  return id;
}

/** Tests uniquement. */
export function resetDeviceIdForTests() {
  cached = null;
}

export function newEventId(): string {
  return randomId();
}
