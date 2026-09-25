const NNBSP = ' '; // espace fine insécable
const NBSP = ' '; // espace insécable
const SPACES = '[ \\u00A0\\u202F]*';

const BEFORE_HIGH_PUNCT = new RegExp(`${SPACES}([;!?])`, 'g');
const BEFORE_COLON = new RegExp(`(\\S)${SPACES}:(?!//)(\\s|$)`, 'g');
const OPEN_QUOTE = new RegExp(`«${SPACES}`, 'g');
const CLOSE_QUOTE = new RegExp(`${SPACES}»`, 'g');

/**
 * Typographie française (spec §1) : espace fine insécable avant ; ! ? et insécable
 * avant :, guillemets « » avec espaces insécables. Idempotent.
 */
export function frenchTypo(text: string): string {
  return text
    .replace(BEFORE_HIGH_PUNCT, `${NNBSP}$1`)
    .replace(BEFORE_COLON, `$1${NBSP}:$2`)
    .replace(/"([^"]*)"/g, `«${NBSP}$1${NBSP}»`)
    .replace(OPEN_QUOTE, `«${NBSP}`)
    .replace(CLOSE_QUOTE, `${NBSP}»`);
}
