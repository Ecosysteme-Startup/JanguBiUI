import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = ['p', 'br', 'sup', 'em', 'i', 'strong', 'b', 'span', 'u'];
/** Seules classes gardées : celles du balisage AELF (numéros de verset). */
const ALLOWED_CLASSES = new Set(['verse_number', 'verse', 'chapter_number']);

/**
 * HTML AELF (`contenu`, refrains, versets) : balises de texte seulement ; seul attribut gardé,
 * `class`, restreint aux classes AELF connues (ni style, ni lien, ni image, ni script).
 */
export const sanitizeAelfHtml = (html: string): string => {
  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName !== 'class') return;
    const kept = data.attrValue.split(/\s+/).filter((c) => ALLOWED_CLASSES.has(c));
    if (kept.length) data.attrValue = kept.join(' ');
    else data.keepAttr = false;
  });
  try {
    return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: ['class'] });
  } finally {
    DOMPurify.removeHook('uponSanitizeAttribute');
  }
};
