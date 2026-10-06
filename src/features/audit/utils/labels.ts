/** Libellés français des actions du journal (codes écrits par les services du backend). */
const ACTIONS: Record<string, string> = {
  'office.nomination': 'Nomination créée',
  'office.fin': 'Nomination terminée',
  'office.annulation': 'Nomination annulée',
  'office.activated': 'Nomination entrée en vigueur',
  'office.terminated': 'Nomination arrivée à échéance',
  'acte.depot': 'Demande d’acte déposée',
  'acte.registre': 'Registre consulté pour une demande',
  'acte.purge_pieces': 'Pièces jointes purgées',
  'acte.start_verification': 'Demande d’acte : vérification commencée',
  'acte.request_info': 'Demande d’acte : complément demandé',
  'acte.mark_ready': 'Demande d’acte : prête à retirer',
  'acte.mark_collected': 'Demande d’acte : original retiré',
  'acte.reject': 'Demande d’acte : rejetée',
  'acte.supplement': 'Demande d’acte : complément envoyé',
  'acte.cancel': 'Demande d’acte : annulée par le demandeur',
  'annonce.creation': 'Annonce créée',
  'annonce.modification': 'Annonce modifiée',
  'annonce.programmation': 'Annonce programmée',
  'annonce.publication': 'Annonce publiée',
  'annonce.retrait': 'Annonce retirée',
  'annonce.suppression': 'Annonce supprimée',
  'evenement.creation': 'Événement créé',
  'evenement.modification': 'Événement modifié',
  'evenement.annulation': 'Événement annulé',
  'confessions.creneau_annulation': 'Créneau de confession annulé',
  'confessions.regle_creation': 'Règle de créneaux créée',
  'confessions.regle_desactivation': 'Règle de créneaux désactivée',
  'capacite.retrait': 'Capacité retirée à un office',
  'capacite.retrait_annule': 'Retrait de capacité annulé',
  'personne.declaration': 'État de vie déclaré',
  'personne.verification': 'État de vie vérifié',
  'conformite.consentement': 'Consentement enregistré',
  'conformite.suppression_compte': 'Compte supprimé à la demande',
  'compte.verrouillage': 'Compte verrouillé',
  'compte.deverrouillage': 'Compte déverrouillé',
  'compte.fermeture_sessions': 'Sessions du compte fermées',
  'compte.mfa_exigee': 'Double authentification exigée',
  'dons.quete_validation': 'Quête validée',
  'dons.quete_saisie': 'Quête saisie',
  'dons.quete_refus': 'Quête refusée',
  'dons.fonds_creation': 'Fonds créé',
  'dons.fonds_modification': 'Fonds modifié',
  'dons.quete_imperee': 'Quête impérée définie',
  'dons.export': 'Dons exportés',
};

/** Familles filtrables (préfixe d'action, filtre `action` de l'API). */
export const ACTION_FAMILIES = [
  { prefix: 'office.', label: 'Nominations' },
  { prefix: 'acte.', label: 'Demandes d’actes' },
  { prefix: 'annonce.', label: 'Annonces' },
  { prefix: 'evenement.', label: 'Agenda' },
  { prefix: 'confessions.', label: 'Confessions' },
  { prefix: 'dons.', label: 'Dons et quêtes' },
  { prefix: 'personne.', label: 'Vérifications de clergé' },
  { prefix: 'capacite.', label: 'Référentiels' },
  { prefix: 'conformite.', label: 'Conformité' },
  { prefix: 'compte.', label: 'Comptes' },
];

/** Rend lisible un code d'action inconnu (« dons.quete_validation » → « Dons et quêtes : quête validation »). */
const humanizeAction = (code: string): string => {
  const dot = code.indexOf('.');
  if (dot < 0) return code.replace(/[._]/g, ' ');
  const prefix = `${code.slice(0, dot)}.`;
  const family = ACTION_FAMILIES.find((f) => f.prefix === prefix)?.label ?? code.slice(0, dot).replace(/[._]/g, ' ');
  const rest = code.slice(dot + 1).replace(/[._]/g, ' ').trim();
  return rest ? `${family} : ${rest}` : family;
};

export const actionLabel = (code: string) => ACTIONS[code] ?? humanizeAction(code);

const TARGETS: Record<string, string> = {
  'hierarchy.OfficeAssignment': 'Nomination',
  'hierarchy.CapabilityOverride': 'Retrait de capacité',
  'hierarchy.Node': 'Nœud',
  'documents.DocumentRequest': 'Demande d’acte',
  'news.Article': 'Annonce',
  'agenda.Event': 'Événement',
  'users.BaseUser': 'Compte',
};

export const targetLabel = (type: string, id: string) => `${TARGETS[type] ?? type} n° ${id}`;
