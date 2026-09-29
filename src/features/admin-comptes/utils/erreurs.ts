import { ApiError } from '@/lib/api-client';

// Codes d'erreur du contrat d'administration des comptes
// (backend docs/ADMIN-KEYCLOAK.md §7) et leur message en français.
export const MESSAGES_ERREUR: Record<string, string> = {
  keycloak_unavailable:
    'Le service de connexion (Keycloak) est injoignable. Rien n’a été modifié : réessayez dans quelques minutes.',
  account_exists: 'Un compte existe déjà avec cette adresse e-mail.',
  account_not_linked:
    'Ce compte n’est pas encore relié à Keycloak. Lancez une resynchronisation du compte avant cette action.',
  active_office:
    'Ce compte a encore une fonction en cours. Mettez fin à ses fonctions avant de le supprimer.',
  last_platform_admin:
    'C’est le dernier administrateur de la plateforme : ce rôle ne peut pas lui être retiré.',
  keycloak_conflict:
    'Keycloak signale un conflit (adresse e-mail déjà utilisée par un autre compte).',
  account_above_scope:
    'Ce compte relève d’un niveau supérieur au vôtre : vous ne pouvez pas agir dessus.',
  account_out_of_scope: 'Ce compte n’est pas dans votre périmètre.',
  account_platform_scope:
    'Ce compte relève de l’administration de la plateforme.',
  node_out_of_scope: 'Ce rattachement n’est pas dans votre périmètre.',
  platform_only:
    'Cette action est réservée aux administrateurs de la plateforme.',
  self_action: 'Vous ne pouvez pas faire cette action sur votre propre compte.',
};

/** Message clair pour une erreur d'API de l'administration des comptes. */
export function messageErreur(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError) {
    if (error.code && MESSAGES_ERREUR[error.code])
      return MESSAGES_ERREUR[error.code];
    if (error.status === 503) return MESSAGES_ERREUR.keycloak_unavailable;
    if (error.status === 404)
      return 'Compte introuvable ou hors de votre périmètre.';
    if (error.status === 403)
      return 'Vous n’avez pas le droit de faire cette action.';
    return error.message || 'L’opération n’a pas abouti.';
  }
  return 'L’opération n’a pas abouti.';
}
