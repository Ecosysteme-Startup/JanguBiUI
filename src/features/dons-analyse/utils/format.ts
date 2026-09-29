// Formats d'affichage des tableaux de bord des dons. Montants en FCFA avec
// espaces insécables (U+00A0) ; jamais d'espace fine, pour rester homogène
// avec le reste de l'application.

export const NBSP = '\u00A0';
const MINUS = '\u2212';

const nombreFr = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/** 1214830 → « 1 214 830 » (espaces insécables). */
export const formatNombre = (n: number): string => {
  const abs = nombreFr.format(Math.abs(n)).replace(/[\s\u202F\u00A0]/g, NBSP);
  return n < 0 ? `${MINUS}${NBSP}${abs}` : abs;
};

/** 1214830 → « 1 214 830 FCFA ». */
export const formatFcfa = (n: number): string =>
  `${formatNombre(n)}${NBSP}FCFA`;

/**
 * Arrondi au millier le plus proche (règle d'agrégat au-dessus de la
 * paroisse) : 1 214 830 → 1 215 000 ; 236 400 → 236 000.
 */
export const arrondiMillier = (n: number): number =>
  Math.round(n / 1000) * 1000;

/** Part entière en pourcentage : 21 %. Total nul → 0 %. */
export const partPourcent = (valeur: number, total: number): number =>
  total > 0 ? Math.round((valeur / total) * 100) : 0;

export const formatPourcent = (p: number): string => `${p}${NBSP}%`;

const MOIS_COURTS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];
const MOIS_LONGS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];
const JOURS_COURTS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const JOURS_LONGS = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
];

// Les dates du contrat sont locales à Dakar (UTC+0, sans heure d'été) : on lit
// les composantes UTC pour que l'affichage ne dépende pas du fuseau du poste.
const d = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);

/** « 27 sept. » */
export const formatJourMois = (iso: string): string => {
  const x = d(iso);
  return `${x.getUTCDate()}${NBSP}${MOIS_COURTS[x.getUTCMonth()]}`;
};

/** « dim. 27 » */
export const formatJourSemaine = (iso: string): string => {
  const x = d(iso);
  return `${JOURS_COURTS[x.getUTCDay()]} ${x.getUTCDate()}`;
};

/** « dimanche 27 sept. » */
export const formatJourLong = (iso: string): string => {
  const x = d(iso);
  return `${JOURS_LONGS[x.getUTCDay()]} ${x.getUTCDate()}${NBSP}${MOIS_COURTS[x.getUTCMonth()]}`;
};

/** « 9:15 » */
export const formatHeure = (iso: string): string => {
  const x = d(iso);
  return `${x.getUTCHours()}:${String(x.getUTCMinutes()).padStart(2, '0')}`;
};

/** « 28 sept., 9:15 » */
export const formatHorodatage = (iso: string): string =>
  `${formatJourMois(iso)}, ${formatHeure(iso)}`;

/** « 2026-09 » → « septembre 2026 » ; `court` → « sept. » */
export const formatMois = (mois: string, court = false): string => {
  const [a, m] = mois.split('-').map(Number);
  return court ? MOIS_COURTS[m - 1] : `${MOIS_LONGS[m - 1]} ${a}`;
};

/** Durée écoulée entre deux instants, en français : « 4 minutes », « 19 heures ». */
export const formatDuree = (
  depuis: string,
  reference: string,
  abrege = false,
): string => {
  const minutes = Math.max(
    0,
    Math.round((d(reference).getTime() - d(depuis).getTime()) / 60000),
  );
  if (minutes < 60) {
    if (abrege) return `${minutes}${NBSP}min`;
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  const heures = Math.round(minutes / 60);
  if (heures < 48) {
    if (abrege) return `${heures}${NBSP}h`;
    return `${heures} heure${heures > 1 ? 's' : ''}`;
  }
  const jours = Math.round(heures / 24);
  return `${jours} jours`;
};

/** 41 → « 41 s » ; 330 → « 5 min 30 ». */
export const formatSecondes = (s: number): string => {
  if (s < 60) return `${Math.round(s)}${NBSP}s`;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return r
    ? `${m}${NBSP}min${NBSP}${String(r).padStart(2, '0')}`
    : `${m}${NBSP}min`;
};

/** Mise en majuscule de la première lettre (« septembre 2026 » → « Septembre 2026 »). */
export const capitaliser = (s: string): string =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

/** « 1er juin 2026 », ou sans l'année : « 31 décembre ». */
export const formatDateLongue = (iso: string, annee = true): string => {
  const x = d(iso);
  const jour = x.getUTCDate() === 1 ? '1er' : String(x.getUTCDate());
  return `${jour}${NBSP}${MOIS_LONGS[x.getUTCMonth()]}${annee ? ` ${x.getUTCFullYear()}` : ''}`;
};
