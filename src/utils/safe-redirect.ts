/**
 * Assainit une destination de redirection venue de l'URL (`?redirectTo=`).
 *
 * Le paramètre était décodé puis passé tel quel à `router.replace()`. Un lien
 * du type `https://jangubi.../auth/login?redirectTo=https%3A%2F%2Fexemple-piege`
 * envoie donc le fidèle sur un site tiers APRÈS une connexion réussie sur le
 * vrai domaine. C'est ce qui rend l'attaque efficace : le lien partagé est
 * authentiquement le nôtre, la connexion est réelle, et la page d'arrivée peut
 * afficher « session expirée, reconnectez-vous » pour récolter le mot de passe.
 *
 * Règle retenue : on n'accepte QUE des chemins internes relatifs. Toute forme
 * capable de désigner un autre hôte est refusée, et on retombe silencieusement
 * sur la destination par défaut — mieux vaut une redirection inattendue mais
 * sûre qu'un renvoi hors du domaine.
 */

/** Destination sûre par défaut quand `redirectTo` est absent ou refusé. */
export const DEFAULT_REDIRECT = '/app';

export function safeRedirect(
  redirectTo: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (!redirectTo) return fallback;

  let candidate = redirectTo;

  // Le paramètre est encodé à l'émission ; il arrive parfois déjà décodé selon
  // le chemin emprunté. Un décodage invalide (`%zz`) lève : c'est en soi le
  // signe d'une valeur trafiquée.
  try {
    candidate = decodeURIComponent(redirectTo);
  } catch {
    return fallback;
  }

  const normalized = candidate.trim();

  if (!normalized) return fallback;

  // Les navigateurs traitent `\` comme `/` dans une URL : `/\exemple.com` et
  // `\\exemple.com` désignent bien un hôte externe. On normalise donc AVANT de
  // juger, sinon le contrôle du double slash se contourne trivialement.
  const slashed = normalized.replace(/\\/g, '/');

  // Doit être un chemin absolu interne : un seul `/` en tête. `//hote` est une
  // URL protocol-relative — un hôte externe déguisé en chemin.
  if (!slashed.startsWith('/') || slashed.startsWith('//')) return fallback;

  // Un chemin interne ne contient jamais de schéma. Couvre `javascript:` et
  // les URL absolues qui auraient franchi le contrôle précédent.
  if (/^[a-z][a-z0-9+.-]*:/i.test(slashed)) return fallback;

  // Ne jamais renvoyer vers l'authentification : la connexion réussie
  // reboucherait sur elle-même.
  if (slashed === '/auth' || slashed.startsWith('/auth/')) return fallback;

  return slashed;
}
