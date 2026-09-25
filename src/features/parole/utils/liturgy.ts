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

/** Titre de la lecture : le livre si le texte vient de la Bible locale, sinon la référence. */
export const readingTitle = (reading: Reading): string => reading.verses[0]?.book ?? reading.citation;

/** Premier livre et chapitre d'une lecture, pour « Ouvrir dans la Bible ». */
export const readingChapter = (reading: Reading): { book: string; chapter: number } | null => {
  const first = reading.verses[0];
  return first ? { book: first.book, chapter: first.chapter } : null;
};

const RANKS: Record<string, string> = {
  ferie: 'Férie',
  dimanche: 'Dimanche',
  solennite: 'Solennité',
  fete: 'Fête',
  fete_du_seigneur: 'Fête du Seigneur',
};

/** « Férie · Jeudi de la 25e semaine du temps ordinaire · année paire ». */
export const calendarLine = (calendar: LiturgyDay['calendar']): string => {
  const cycle =
    calendar.rank === 'ferie'
      ? calendar.weekday_cycle === 'II'
        ? 'année paire'
        : 'année impaire'
      : `année ${calendar.sunday_cycle}`;
  return [RANKS[calendar.rank] ?? capitalize(calendar.rank), calendar.celebration, cycle].join(' · ');
};

export const ISO = 'YYYY-MM-DD';

/** Une date AAAA-MM-JJ valide, sinon `undefined` (le jour courant sera servi). */
export const parseIsoDate = (value: string | undefined | null): string | undefined => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const d = dayjs(value);
  return d.isValid() && d.format(ISO) === value ? value : undefined;
};

/** Fenêtre de jours autour de la date affichée (maquette : J-2 à J+3). */
export const dayWindow = (date: string, before = 2, after = 3) =>
  Array.from({ length: before + after + 1 }, (_, i) => {
    const d = dayjs(date).add(i - before, 'day');
    return { iso: d.format(ISO), offset: i - before, weekday: capitalize(d.format('ddd')), day: d.format('D') };
  });

export const shiftDay = (date: string, delta: number) => dayjs(date).add(delta, 'day').format(ISO);

const ROSARY_GROUPS = ['joyeux', 'douloureux', 'glorieux', 'lumineux', 'douloureux', 'joyeux', 'glorieux'];

/** Mystères du jour selon l'usage (lundi = 0) : lundi et samedi joyeux, jeudi lumineux… */
export const rosaryOfDay = (date: string) => {
  const d = dayjs(date);
  const mondayFirst = (d.day() + 6) % 7;
  return { weekday: d.format('dddd'), group: ROSARY_GROUPS[mondayFirst] };
};
