import DOMPurify from 'isomorphic-dompurify';

/** Balises produites par l'éditeur (paragraphes, intertitres, listes, citations, liens). */
const ALLOWED_TAGS = ['p', 'br', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote', 'a'];
const ALLOWED_ATTR = ['href'];

/**
 * Assainit le HTML de l'éditeur avant envoi et avant aperçu. Le serveur assainit aussi
 * (nh3) : défense en profondeur. Les liens ne gardent que http(s), mailto et tel.
 */
export const sanitizeArticleHtml = (html: string): string =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:)/i,
  });

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Contenu d'un article ancien (`content_format = text`) : un paragraphe par bloc, sans HTML interprété. */
export const textToHtml = (text: string): string =>
  text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');

const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Décode les entités HTML (sinon l'aperçu affichait « d&#39;annonce » ou « &amp; » — double échappement). */
const decodeEntities = (text: string): string =>
  text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, name: string) => NAMED_ENTITIES[name]!);

/** Texte visible d'un HTML (aperçu, compte de mots, contenu vide) : balises retirées, entités décodées. */
export const htmlToText = (html: string): string =>
  decodeEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

/** « 214 mots · 1 min de lecture » (200 mots par minute, au moins une minute). */
export const readingStats = (html: string): string => {
  const words = htmlToText(html).split(' ').filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${words} mot${words > 1 ? 's' : ''} · ${minutes} min de lecture`;
};
