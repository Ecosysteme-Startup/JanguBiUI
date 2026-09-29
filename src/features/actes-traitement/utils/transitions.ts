import type { RequestStatus } from '@/components/signature/status-dot';

/** Actions de la paroisse (segment d'URL de `POST /staff/documents/{id}/{transition}/`). */
export type Transition = 'start-verification' | 'request-info' | 'mark-ready' | 'mark-collected' | 'reject';

/**
 * Cycle SRS §8.1, côté paroisse (miroir de `TRANSITIONS` dans apps/documents/services.py).
 * Une action absente de la liste n'est PAS affichée : le serveur la refuserait (400).
 */
export const TRANSITIONS_BY_STATUS: Record<RequestStatus, Transition[]> = {
  submitted: ['start-verification'],
  under_verification: ['mark-ready', 'request-info', 'reject'],
  info_requested: [],
  ready_for_pickup: ['mark-collected'],
  collected: [],
  rejected: [],
  cancelled: [],
};

export const allowedTransitions = (status: RequestStatus): Transition[] => TRANSITIONS_BY_STATUS[status];

export const isClosed = (status: RequestStatus) => status === 'collected' || status === 'rejected' || status === 'cancelled';

/** Explication de l'étape suivante, par statut. */
export const NEXT_STEP: Record<RequestStatus, string> = {
  submitted: 'Demande reçue. Ouvrez le registre pour commencer la vérification.',
  under_verification: 'Acte retrouvé et signé ? Marquez la demande prête à retirer. Sinon, demandez un complément ou rejetez-la.',
  info_requested: 'En attente du complément du fidèle. La demande reviendra en vérification dès sa réponse.',
  ready_for_pickup: 'L’original signé et scellé attend le fidèle au secrétariat.',
  collected: 'Demande close : l’original a été remis.',
  rejected: 'Demande close : rejetée, motif transmis au fidèle.',
  cancelled: 'Demande close : annulée par le fidèle.',
};
