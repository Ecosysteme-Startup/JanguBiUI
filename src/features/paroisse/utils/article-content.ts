import DOMPurify from 'isomorphic-dompurify';

/** Balises éditoriales admises dans une annonce (TipTap côté back-office). Rien d'autre. */
const ALLOWED_TAGS = ['p', 'br', 'hr', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote'];
const ALLOWED_ATTR = ['href', 'title'];

const LOOKS_LIKE_HTML = /<\/?[a-z][a-z0-9]*[\s>/]/i;

export type ArticleBody = { kind: 'html'; html: string } | { kind: 'text'; paragraphs: string[] };

/** Nettoie un HTML venu du serveur : ni script, ni gestionnaire d'événement, ni URL `javascript:`. */
export const sanitizeArticleHtml = (html: string): string => {
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOW_DATA_ATTR: false });
  // Liens sortants : jamais d'accès à la fenêtre d'origine.
  return clean.replace(/<a(\s|>)/g, '<a rel="noopener noreferrer" target="_blank"$1');
};

/**
 * Corps d'une annonce selon `content_format`. Des annonces anciennes marquées `text`
 * contiennent du HTML : elles sont traitées comme du HTML, nettoyé, plutôt qu'affichées brutes.
 */
export const articleBody = (content: string, format: 'text' | 'html'): ArticleBody => {
  if (format === 'html' || LOOKS_LIKE_HTML.test(content)) return { kind: 'html', html: sanitizeArticleHtml(content) };
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return { kind: 'text', paragraphs };
};

/** Durée de lecture (≈ 200 mots/min), au moins une minute. */
export const readingMinutes = (content: string) => {
  const words = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};
