import type { LiturgyDay, Reading } from '@/features/parole/api/get-liturgy-day';
import { dayjs } from '@/utils/dates';

const ORDINALS = ['Première', 'Deuxième', 'Troisième', 'Quatrième', 'Cinquième', 'Sixième', 'Septième'];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Libellé d'une lecture à partir de son type AELF (`lecture_1`, `psaume`, `evangile`…). */
export const readingLabel = (type: string): string => {
  const t = type.toLowerCase();
  const lecture = /^lecture_?(\d+)$/.exec(t);
  if (lecture) return `${ORDINALS[Number(lecture[1]) - 1] ?? `${lecture[1]}e`} lecture`;
  const known: Record<string, string> = {
    psaume: 'Psaume',
    cantique: 'Cantique',
    evangile: 'Évangile',
    sequence: 'Séquence',
    epitre: 'Épître',
  };
  return known[t] ?? capitalize(t.replace(/_/g, ' '));
};

export const isGospel = (type: string) => type.toLowerCase() === 'evangile';
const isPsalmLike = (type: string) => ['psaume', 'cantique', 'sequence'].includes(type.toLowerCase());

/** Acclamation finale, comme à la messe (aucune après un psaume). */
export const closingFormula = (type: string): string | null => {
  if (isGospel(type)) return '— Acclamons la Parole de Dieu.';
  if (isPsalmLike(type)) return null;
  return '— Parole du Seigneur.';
};

const EVANGELISTS = ['Matthieu', 'Marc', 'Luc', 'Jean'];

/**
 * Titre de la lecture : « Évangile de Jésus Christ selon saint Luc », « Psaume 90 », sinon le livre
 * (texte de la Bible locale) ; à défaut de versets, la référence.
 */
export const readingTitle = (reading: Reading): string => {
  const first = reading.verses[0];
  if (!first) return reading.citation;
  if (isGospel(reading.type) && EVANGELISTS.includes(first.book)) return `Évangile de Jésus Christ selon saint ${first.book}`;
  if (isPsalmLike(reading.type) && /^psaume/i.test(first.book)) return `Psaume ${first.chapter}`;
  return first.book;
};

/** Premier livre et chapitre d'une lecture, pour « Ouvrir dans la Bible ». */
export const readingChapter = (reading: Reading): { book: string; chapter: number } | null => {
  const first = reading.verses[0];
  return first ? { book: first.book, chapter: first.chapter } : null;
};

export const ISO = 'YYYY-MM-DD';

/** Une date AAAA-MM-JJ valide, sinon `undefined` (le jour courant sera servi). */
export const parseIsoDate = (value: string | undefined | null): string | undefined => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const d = dayjs(value);
  return d.isValid() && d.format(ISO) === value ? value : undefined;
};

/** Semaine (lundi → dimanche) qui contient la date, pour la bande de dates (FID-Parole). */
export const weekOf = (date: string): string[] => {
  const d = dayjs(date);
  const monday = d.subtract((d.day() + 6) % 7, 'day');
  return Array.from({ length: 7 }, (_, i) => monday.add(i, 'day').format(ISO));
};

/** Libellé court d'un jour dans la bande : « Férie », « Dimanche », « S. Matthieu ». */
export const dayTileLabel = (calendar: Pick<LiturgyDay['calendar'], 'rank' | 'celebration'>): string => {
  if (calendar.rank === 'ferie') return 'Férie';
  if (calendar.rank === 'dimanche') return 'Dimanche';
  const head = calendar.celebration.split(',')[0].trim();
  return head.replace(/^Saint(e)?\s/, (_, e: string | undefined) => (e ? 'Ste ' : 'S. ')).replace(/^Saints\s/, 'Sts ');
};

/** « Année paire, cycle A » (férie) ; « Cycle A » (dimanche et fête). */
export const yearLine = (calendar: Pick<LiturgyDay['calendar'], 'rank' | 'sunday_cycle' | 'weekday_cycle'>): string =>
  calendar.rank === 'ferie'
    ? `Année ${calendar.weekday_cycle === 'II' ? 'paire' : 'impaire'}, cycle ${calendar.sunday_cycle}`
    : `Cycle ${calendar.sunday_cycle}`;

/** Onglet d'une lecture : « Lecture » s'il n'y en a qu'une, sinon « 1re lecture », « 2e lecture » ; « Psaume », « Évangile ». */
export const readingTabLabel = (readings: Pick<Reading, 'type'>[], index: number): string => {
  const type = readings[index].type.toLowerCase();
  const lecture = /^lecture_?(\d+)$/.exec(type);
  if (!lecture) return readingLabel(type);
  const lectures = readings.filter((r) => /^lecture_?\d+$/.test(r.type.toLowerCase())).length;
  if (lectures <= 1) return 'Lecture';
  return lecture[1] === '1' ? '1re lecture' : `${lecture[1]}e lecture`;
};

/** « Psaumes 90 », « Luc 9 » ; à défaut de versets (texte AELF), la référence. */
export const readingShortTitle = (reading: Reading): string => {
  const first = reading.verses[0];
  return first ? `${first.book} ${first.chapter}` : reading.citation;
};

/** Texte brut d'une lecture (copie) : référence, puis versets numérotés. */
export const readingPlainText = (reading: Reading): string => {
  const body = reading.verses.length
    ? reading.verses.map((v) => `${v.number} ${v.text}`).join('\n')
    : (reading.text ?? '')
        .replace(/<\/?(p|br)\b[^>]*>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
  return `${readingLabel(reading.type)} · ${reading.citation}\n\n${body}`;
};

export const shiftDay = (date: string, delta: number) => dayjs(date).add(delta, 'day').format(ISO);
