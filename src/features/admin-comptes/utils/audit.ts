// Libellés et familles des actions `compte.admin.*` journalisées par le
// backend (apps/users/services_admin.py, apis_admin.py).

export const LIBELLES_ACTION_AUDIT: Record<string, string> = {
  creation: 'Compte créé',
  modification: 'Profil modifié',
  desactivation: 'Compte désactivé',
  reactivation: 'Compte réactivé',
  suppression: 'Compte supprimé',
  actions_email: 'E-mail d’actions envoyé',
  verification_email_envoyee: 'Vérification de l’e-mail renvoyée',
  email_marque_verifie: 'E-mail marqué comme vérifié',
  deconnexion_sessions: 'Déconnexion forcée',
  session_revoquee: 'Session fermée',
  otp_reinitialise: 'Double authentification réinitialisée',
  deblocage_force_brute: 'Compte déverrouillé',
  role_plateforme_ajoute: 'Rôle plateforme donné',
  role_plateforme_retire: 'Rôle plateforme retiré',
  resynchronisation: 'Compte resynchronisé',
  export: 'Export CSV des comptes',
  reconciliation: 'Réconciliation lancée',
};

export type FamilleAudit =
  | 'Création'
  | 'Profil'
  | 'Statut'
  | 'Sécurité'
  | 'Rôle'
  | 'Synchronisation'
  | 'Autre';

const FAMILLES: Record<string, FamilleAudit> = {
  creation: 'Création',
  modification: 'Profil',
  email_marque_verifie: 'Profil',
  verification_email_envoyee: 'Profil',
  desactivation: 'Statut',
  reactivation: 'Statut',
  suppression: 'Statut',
  actions_email: 'Sécurité',
  deconnexion_sessions: 'Sécurité',
  session_revoquee: 'Sécurité',
  otp_reinitialise: 'Sécurité',
  deblocage_force_brute: 'Sécurité',
  role_plateforme_ajoute: 'Rôle',
  role_plateforme_retire: 'Rôle',
  resynchronisation: 'Synchronisation',
  reconciliation: 'Synchronisation',
};

const court = (action: string) => action.replace(/^compte\.admin\./, '');

export const libelleAction = (action: string) =>
  LIBELLES_ACTION_AUDIT[court(action)] ?? action;

export const familleAction = (action: string): FamilleAudit =>
  FAMILLES[court(action)] ?? 'Autre';

/** Motif éventuel stocké dans les métadonnées de l'entrée. */
export const motifAudit = (metadata: unknown): string | null => {
  if (metadata && typeof metadata === 'object' && 'motif' in metadata) {
    const m = (metadata as { motif: unknown }).motif;
    return typeof m === 'string' && m ? m : null;
  }
  return null;
};
