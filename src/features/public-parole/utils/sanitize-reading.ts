/**
 * Module à part de `readings.ts` : l'accueil public (extrait de l'Évangile) n'a pas à embarquer
 * DOMPurify (~10 Ko gzip), seuls les écrans qui affichent le texte complet le chargent.
 */
export { sanitizeAelfHtml as sanitizeReadingHtml } from '@/utils/sanitize-aelf';
