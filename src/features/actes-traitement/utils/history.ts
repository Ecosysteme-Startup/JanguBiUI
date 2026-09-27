import type { StatusLog } from '../types/processing';

type WithHistory = { status: string; history: StatusLog[] };

const isComplement = (entry: StatusLog) => entry.by_requester && entry.from_status === 'info_requested' && entry.to_status === 'under_verification';

/** Dernier complément envoyé par le fidèle, tant que la demande est revenue en vérification. */
export const complementReceived = (request: WithHistory): StatusLog | null => {
  if (request.status !== 'under_verification') return null;
  const last = request.history[request.history.length - 1];
  return last && isComplement(last) ? last : null;
};

/** Date d'entrée dans le statut courant (« depuis le 21 sept. »). */
export const statusSince = (request: WithHistory): string | null =>
  [...request.history].reverse().find((entry) => entry.to_status === request.status)?.created_at ?? null;

const LABELS: Record<string, string> = {
  submitted: 'Soumise',
  under_verification: 'Passée en vérification',
  info_requested: 'Complément demandé',
  ready_for_pickup: 'Prête à retirer',
  collected: 'Original remis',
  rejected: 'Rejetée',
  cancelled: 'Annulée',
};

/** Libellé d'une étape de l'historique (maquette PAR-Demande-Detail). */
export const historyEntryLabel = (entry: StatusLog): string => {
  if (isComplement(entry)) return 'Complément reçu';
  if (entry.to_status === 'submitted' && entry.by_requester) return 'Soumise depuis l’espace fidèle';
  if (entry.to_status === 'cancelled' && entry.by_requester) return 'Annulée par le fidèle';
  return LABELS[entry.to_status] ?? entry.to_status;
};

/** Couleur du point de l'étape (jamais seule : le libellé porte le sens). */
export const historyEntryDot = (entry: StatusLog): string => {
  if (isComplement(entry)) return 'bg-ok-dot';
  return (
    {
      under_verification: 'bg-primary-fill',
      info_requested: 'bg-warn-dot',
      ready_for_pickup: 'bg-ok-dot',
      rejected: 'bg-err-fill',
    }[entry.to_status] ?? 'bg-ink-4'
  );
};
