import type { Reading } from '../api/get-liturgy-day';

const LABELS: [RegExp, string][] = [
  [/^lecture_?1$|^premiere/i, 'Première lecture'],
  [/^lecture_?2$|^deuxieme/i, 'Deuxième lecture'],
  [/^lecture_?3$/i, 'Troisième lecture'],
  [/acclamation/i, 'Acclamation de l’Évangile'],
  [/psaume/i, 'Psaume'],
  [/cantique/i, 'Cantique'],
  [/sequence/i, 'Séquence'],
  [/^epitre/i, 'Épître'],
  [/evangile/i, 'Évangile'],
];

/** Libellé français d'un type de lecture (AELF : lecture_1, psaume, evangile…). */
export const readingLabel = (type: string) => {
  const found = LABELS.find(([pattern]) => pattern.test(type));
  if (found) return found[1];
  const words = type.replace(/_/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** Ancre stable d'une lecture dans la page (`#lecture-1`, `#psaume`, `#evangile`). */
export const readingAnchor = (reading: Reading, index: number) => {
  const slug = reading.type
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || `lecture-${index + 1}`;
};

const stripTags = (html: string) =>
  html
    .replace(/<sup>[^<]*<\/sup>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, '’')
    .replace(/\s+/g, ' ')
    .trim();

/** Premier passage d'une lecture, pour une citation courte (accueil). */
export const readingExcerpt = (reading: Reading, maxLength = 180): { text: string; verse?: number } | null => {
  const first = reading.verses[0];
  const raw = first ? first.text : reading.text ? stripTags(reading.text) : '';
  if (!raw) return null;
  const sentence = raw.split(/(?<=[.;!?])\s/)[0] ?? raw;
  const text = sentence.length > maxLength ? `${sentence.slice(0, maxLength).replace(/\s+\S*$/, '')}…` : sentence;
  return { text, verse: first?.number };
};

const GOSPELS = /^(Matthieu|Marc|Luc|Jean)$/;

/** Nom du livre au singulier (« Psaumes » → « Psaume »). */
const bookName = (book: string) => (book === 'Psaumes' ? 'Psaume' : book);

/**
 * Titre d'une lecture : livre en toutes lettres et versets de la référence
 * (« Ecclésiaste 11, 9 – 12, 8 », « Évangile selon saint Luc 9, 43b-45 »).
 * Sans verset (texte AELF seul), la référence abrégée est gardée telle quelle.
 */
export const readingTitle = (reading: Reading) => {
  const book = reading.verses[0]?.book;
  const numbers = reading.citation.replace(/^\S+\s+/, '');
  if (!book || numbers === reading.citation) return reading.citation;
  if (GOSPELS.test(book) && readingLabel(reading.type) === 'Évangile') return `Évangile selon saint ${book} ${numbers}`;
  return `${bookName(book)} ${numbers}`;
};

/** Référence courte pour une grille : le psaume sans ses versets (« Ps 89 (90) »). */
export const shortCitation = (citation: string) => (/^Ps\b/.test(citation) ? citation.replace(/,.*$/, '') : citation);

type ReadingKind = 'lecture' | 'psaume' | 'evangile';

const kindOf = (reading: Reading): ReadingKind => {
  const label = readingLabel(reading.type);
  if (label === 'Psaume' || label === 'Cantique') return 'psaume';
  if (label === 'Évangile' || label === 'Acclamation de l’Évangile') return 'evangile';
  return 'lecture';
};

/** Première lecture (ou psaume, ou évangile) du jour ; l'acclamation n'est pas l'Évangile. */
export const findReading = (readings: Reading[], kind: ReadingKind) =>
  readings.find((reading) => kindOf(reading) === kind && readingLabel(reading.type) !== 'Acclamation de l’Évangile');

export type ReadingTab = { key: 'lectures' | 'psaume' | 'evangile'; label: string; readings: Reading[] };

/** Les trois onglets de la Parole du jour (WEB-Parole-du-jour) ; un onglet vide est retiré. */
export const readingTabs = (readings: Reading[]): ReadingTab[] =>
  (
    [
      { key: 'lectures', label: 'Lectures', readings: readings.filter((r) => kindOf(r) === 'lecture') },
      { key: 'psaume', label: 'Psaume', readings: readings.filter((r) => kindOf(r) === 'psaume') },
      { key: 'evangile', label: 'Évangile', readings: readings.filter((r) => kindOf(r) === 'evangile') },
    ] satisfies ReadingTab[]
  ).filter((tab) => tab.readings.length > 0);

/** Référence du premier verset (« Ecclésiaste 11, 8 ») ; `null` sans verset. */
export const firstVerseReference = (reading: Reading) => {
  const verse = reading.verses[0];
  return verse ? `${bookName(verse.book)} ${verse.chapter}, ${verse.number}` : null;
};

/** Onglet d'une lecture dans la Parole du jour (ancre `#lectures`, `#psaume`, `#evangile`). */
export const readingTabKey = (reading: Reading): ReadingTab['key'] => {
  const kind = kindOf(reading);
  return kind === 'lecture' ? 'lectures' : kind;
};

/** Intitulé d'une lecture : le livre (« Ecclésiaste »), « Psaume » ou « Évangile selon saint Luc ». */
export const readingHeading = (reading: Reading) => {
  const book = reading.verses[0]?.book;
  if (!book) return readingLabel(reading.type);
  if (GOSPELS.test(book) && readingLabel(reading.type) === 'Évangile') return `Évangile selon saint ${book}`;
  return bookName(book);
};
