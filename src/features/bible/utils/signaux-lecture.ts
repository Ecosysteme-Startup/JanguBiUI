import {
  envoyerEvenements,
  type EvenementLecture,
  TAILLE_LOT_MAX,
} from '../api/post-evenements';

// File des signaux de lecture (API-PAROLE-POUR-VOUS §1) : les événements sont
// mis en file (hors ligne compris, dans le stockage du navigateur), puis
// envoyés par lots de 200 au plus, quelques secondes après la lecture ou quand
// l'onglet se cache. Chaque événement porte un `client_event_id` : un lot
// renvoyé deux fois n'est enregistré qu'une fois. Personnalisation désactivée
// (réponse `personnalisation_parole: false`) : on cesse d'envoyer.

const CLE_FILE = 'jb_parole_signaux';
const CLE_COUPES = 'jb_parole_signaux_coupes';
const FILE_MAX = 1000;
export const DELAI_ENVOI_MS = 3000;

export type SignalLecture = Omit<
  EvenementLecture,
  'client_event_id' | 'occurred_at'
>;

const lire = <T>(cle: string, defaut: T): T => {
  try {
    const brut = localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : defaut;
  } catch {
    return defaut;
  }
};

const ecrire = (cle: string, valeur: unknown) => {
  try {
    if (valeur === null) localStorage.removeItem(cle);
    else localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    // stockage indisponible : la file reste en mémoire
  }
};

let file: EvenementLecture[] | null = null;
let minuteur: ReturnType<typeof setTimeout> | null = null;
let envoi: Promise<void> | null = null;
let ecoute = false;

const laFile = () => {
  if (!file) file = lire<EvenementLecture[]>(CLE_FILE, []);
  return file;
};

const identifiant = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

export const signauxCoupes = (): boolean => lire<boolean>(CLE_COUPES, false);

/**
 * Suit le réglage lu du serveur (`pour-vous/`, `reglages/`) : désactivé, on
 * vide la file et on n'envoie plus rien ; réactivé, on reprend.
 */
export const definirSignauxActifs = (actifs: boolean) => {
  if (actifs) {
    ecrire(CLE_COUPES, null);
  } else {
    ecrire(CLE_COUPES, true);
    file = [];
    ecrire(CLE_FILE, null);
  }
};

const ecouterSortie = () => {
  if (ecoute || typeof window === 'undefined') return;
  ecoute = true;
  const partir = () => void viderSignaux();
  window.addEventListener('pagehide', partir);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') partir();
  });
};

const planifier = () => {
  if (minuteur) return;
  minuteur = setTimeout(() => {
    minuteur = null;
    void viderSignaux();
  }, DELAI_ENVOI_MS);
};

/** Met un signal en file ; il partira avec le prochain lot. */
export const signalerLecture = (
  signal: SignalLecture,
  maintenant: Date = new Date(),
) => {
  if (signauxCoupes()) return;
  const f = laFile();
  f.push({
    client_event_id: identifiant(),
    occurred_at: maintenant.toISOString(),
    ...signal,
  });
  if (f.length > FILE_MAX) f.splice(0, f.length - FILE_MAX);
  ecrire(CLE_FILE, f);
  ecouterSortie();
  planifier();
};

/** Envoie la file par lots. Une erreur réseau garde les signaux pour plus tard. */
export const viderSignaux = (): Promise<void> => {
  if (envoi) return envoi;
  envoi = (async () => {
    try {
      while (laFile().length && !signauxCoupes()) {
        const lot = laFile().slice(0, TAILLE_LOT_MAX);
        const reponse = await envoyerEvenements(lot);
        // Les rejetés (référence inconnue) ne seront jamais acceptés : le
        // lot entier sort de la file.
        const envoyes = new Set(lot.map((e) => e.client_event_id));
        file = laFile().filter((e) => !envoyes.has(e.client_event_id));
        ecrire(CLE_FILE, file.length ? file : null);
        if (!reponse.personnalisation_parole) definirSignauxActifs(false);
      }
    } catch {
      // hors ligne ou erreur serveur : nouvel essai au prochain signal
    } finally {
      envoi = null;
    }
  })();
  return envoi;
};

/** Signaux en attente (tests, diagnostic). */
export const signauxEnAttente = (): EvenementLecture[] => [...laFile()];

/** Réinitialise l'état en mémoire (tests). */
export const reinitialiserSignaux = () => {
  if (minuteur) clearTimeout(minuteur);
  minuteur = null;
  file = null;
  envoi = null;
  ecrire(CLE_FILE, null);
  ecrire(CLE_COUPES, null);
};
