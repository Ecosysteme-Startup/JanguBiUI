// Règles d'envoi (API-AUDIO §2) : 500 Mo au plus ; mp3, m4a, aac, wav, flac,
// ogg, opus ; extension et type cohérents.

export const TAILLE_MAX = 500 * 1024 * 1024;

export const EXTENSIONS_AUDIO: Record<string, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  flac: 'audio/flac',
  ogg: 'audio/ogg',
  opus: 'audio/opus',
};

export const ACCEPT_AUDIO = Object.keys(EXTENSIONS_AUDIO)
  .map((e) => `.${e}`)
  .join(',');

export const extension = (nom: string) =>
  nom.includes('.') ? nom.split('.').pop()!.toLowerCase() : '';

/** Message lisible si le fichier ne peut pas être envoyé, sinon null. */
export function verifierFichier(file: File): string | null {
  const ext = extension(file.name);
  if (!EXTENSIONS_AUDIO[ext]) {
    return 'Ce format n’est pas accepté. Formats possibles : mp3, m4a, aac, wav, flac, ogg, opus.';
  }
  if (file.size > TAILLE_MAX) {
    return 'Ce fichier dépasse 500 Mo. Découpez l’enregistrement ou exportez-le dans un format plus léger (m4a, mp3).';
  }
  if (file.size === 0) return 'Ce fichier est vide.';
  return null;
}

/** Type MIME cohérent avec l'extension (certains navigateurs n'en donnent pas). */
export const typeAudio = (file: File) =>
  file.type && file.type.startsWith('audio/')
    ? file.type
    : (EXTENSIONS_AUDIO[extension(file.name)] ?? 'application/octet-stream');

/** « 09-priere-universelle.m4a » → « Priere universelle ». */
export function titreDepuisNom(nom: string): string {
  const base = nom.replace(/\.[^.]+$/, '').replace(/^\d+[\s._-]*/, '');
  const t = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return t ? t[0].toUpperCase() + t.slice(1) : nom;
}
