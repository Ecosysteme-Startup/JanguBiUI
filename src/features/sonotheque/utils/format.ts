import type { AlbumKind, SourceKind, Visibilite } from '../types/schemas';

const NBSP = ' ';

const collator = new Intl.Collator('fr', { sensitivity: 'base' });
/** Tri alphabétique français (seul ordre autorisé entre sources). */
export const compareFr = (a: string, b: string) => collator.compare(a, b);

/** 214.6 → « 3:34 » ; 3 h et plus → « 1:02:05 ». */
export function formatDuree(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '—';
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const ss = r.toString().padStart(2, '0');
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Durée totale lisible : « 36 min », « 1 h 06 ». */
export function formatDureeTotale(seconds: number): string {
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min}${NBSP}min`;
  const h = Math.floor(min / 60);
  return `${h}${NBSP}h${NBSP}${(min % 60).toString().padStart(2, '0')}`;
}

/** Temps restant arrondi à la minute : « 6 min restantes ». */
export function formatRestant(
  position: number,
  duree: number | null,
): string | null {
  if (!duree || duree <= 0) return null;
  const min = Math.max(1, Math.round((duree - position) / 60));
  return `${min}${NBSP}min restante${min > 1 ? 's' : ''}`;
}

/** 38 600 000 → « 38,6 Mo ». */
export function formatTaille(bytes: number): string {
  const mo = bytes / (1024 * 1024);
  if (mo >= 1024) {
    return `${(mo / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}${NBSP}Go`;
  }
  if (mo >= 1) {
    return `${mo.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}${NBSP}Mo`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))}${NBSP}Ko`;
}

const dateCourte = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
});
const dateLongue = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const heure = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
});

const memeJour = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** « Aujourd’hui 10:58 » ou « 24 sept. ». */
export function formatMisAJour(
  iso: string | null | undefined,
  now = new Date(),
): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  if (memeJour(d, now)) return `Aujourd’hui ${heure.format(d)}`;
  return dateCourte.format(d).replace(' ', NBSP);
}

export function formatDateCourte(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : dateCourte.format(d).replace(' ', NBSP);
}

export function formatDateLongue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : dateLongue.format(d);
}

export const LIBELLES_LANGUE: Record<string, string> = {
  fr: 'Français',
  wo: 'Wolof',
  la: 'Latin',
  srr: 'Sérère',
  dyo: 'Diola',
  en: 'Anglais',
  autre: 'Autre',
};

/** Étiquette courte de langue : « FR », « WO »… */
export const codeLangue = (l: string) =>
  l && l !== 'autre' ? l.toUpperCase() : '—';

export const LIBELLES_TEMPS: Record<string, string> = {
  avent: 'Avent',
  noel: 'Temps de Noël',
  careme: 'Carême',
  triduum: 'Triduum pascal',
  paques: 'Temps pascal',
  ordinaire: 'Temps ordinaire',
};

export const LIBELLES_ALBUM: Record<AlbumKind, string> = {
  album: 'Album',
  messe: 'Messe',
  homelies: 'Homélies',
  retraite: 'Retraite',
};

export const LIBELLES_SOURCE: Record<SourceKind, string> = {
  paroisse: 'Paroisse',
  chorale: 'Chorale',
  mouvement: 'Mouvement',
};

export const LIBELLES_VISIBILITE: Record<Visibilite, string> = {
  public: 'Public',
  paroisse: 'Paroissiens',
  prive: 'Privé',
};

/** Monogramme d'une source ou d'un album : « Chorale Sainte-Cécile » → « SC ». */
export function monogramme(nom: string): string {
  const mots = nom
    .replace(/^(Chorale|Paroisse)\s+/i, '')
    .split(/[\s-]+/)
    .filter((m) => /^[A-Za-zÀ-ÿ]/.test(m))
    .filter((m) => !/^(de|du|des|la|le|les|l’|d’|et|à|pour)$/i.test(m));
  const initiales = mots.slice(0, 2).map((m) => m[0]?.toUpperCase() ?? '');
  return initiales.join('') || nom.slice(0, 2).toUpperCase();
}

export const pluriel = (n: number, un: string, plusieurs: string) =>
  `${n}${NBSP}${n > 1 ? plusieurs : un}`;
