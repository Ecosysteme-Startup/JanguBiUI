import DOMPurify from 'isomorphic-dompurify';

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

/** Texte AELF : HTML nettoyé, réduit aux balises de mise en forme du texte. */
export const sanitizeReadingHtml = (html: string) =>
  DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p', 'br', 'sup', 'em', 'i', 'strong', 'b', 'span'], ALLOWED_ATTR: [] });

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
