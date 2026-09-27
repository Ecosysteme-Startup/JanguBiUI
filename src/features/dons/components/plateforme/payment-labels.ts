import type { BadgeTone } from '@/components/ui/badge';
import type { IconName } from '@/components/ui/icon';

/** Incident de notification (code `error` du serveur) : libellé, explication, action recommandée. */
export type IncidentText = { label: string; detail: string; action: string };

export const INCIDENTS: Record<string, IncidentText> = {
  invalid_signature: {
    label: 'Signature invalide',
    detail:
      'Notification rejetée : sa signature ne correspond pas à la clé de l’agrégateur.',
    action: 'Vérifier la clé de signature. Rien à faire si le cas reste isolé.',
  },
  amount_mismatch: {
    label: 'Montant incohérent',
    detail:
      'Montant notifié différent du montant initié. Paiement bloqué en attente.',
    action: 'Demander le détail à l’agrégateur avant toute confirmation.',
  },
  late_payment: {
    label: 'Paiement tardif',
    detail: 'Confirmation reçue après l’expiration du paiement.',
    action:
      'Signaler à l’économe de la paroisse, qui fait rembourser le donateur par l’agrégateur.',
  },
  provider_unavailable: {
    label: 'Agrégateur injoignable',
    detail:
      'Le statut n’a pas pu être relu chez l’agrégateur. Le paiement sera repris au prochain passage.',
    action: 'Aucune. Suivre la page de statut de l’agrégateur.',
  },
  unknown_reference: {
    label: 'Référence inconnue',
    detail:
      'Notification pour un paiement qu’aucune ouverture de Jàngu Bi ne connaît.',
    action: 'Vérifier auprès de l’agrégateur l’origine de ce paiement.',
  },
};

export const incidentText = (code: string): IncidentText =>
  INCIDENTS[code] ?? {
    label: 'Erreur de traitement',
    detail: code ? `Code renvoyé : ${code}.` : 'Notification non traitée.',
    action: 'Consulter le journal d’audit.',
  };

/** Statut de la notification en cause (`PaymentWebhookEvent.status`). */
export const WEBHOOK_STATUS: Record<
  string,
  { label: string; tone: BadgeTone; icon?: IconName }
> = {
  rejete: { label: 'Rejetée', tone: 'warn' },
  erreur: { label: 'Erreur', tone: 'warn' },
  recu: { label: 'En reprise', tone: 'info' },
  traite: { label: 'Traitée', tone: 'muted', icon: 'check' },
  doublon: { label: 'Doublon', tone: 'muted', icon: 'check' },
};

/** Lignes du tableau des notifications sur 7 jours (clés de `webhooks_7d_by_status`). */
export const WEBHOOK_ROWS: {
  status: string;
  label: string;
  alert?: boolean;
}[] = [
  { status: 'traite', label: 'Traitées' },
  { status: 'doublon', label: 'Doublons ignorés' },
  { status: 'rejete', label: 'Rejetées, signature', alert: true },
  { status: 'erreur', label: 'Erreurs', alert: true },
];
