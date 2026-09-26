import DOMPurify from 'isomorphic-dompurify';

/**
 * Texte AELF : HTML nettoyé, réduit aux balises de mise en forme du texte.
 * Module à part de `readings.ts` : l'accueil public (extrait de l'Évangile) n'a pas à embarquer
 * DOMPurify (~10 Ko gzip), seuls les écrans qui affichent le texte complet le chargent.
 */
export const sanitizeReadingHtml = (html: string) =>
  DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p', 'br', 'sup', 'em', 'i', 'strong', 'b', 'span'], ALLOWED_ATTR: [] });
