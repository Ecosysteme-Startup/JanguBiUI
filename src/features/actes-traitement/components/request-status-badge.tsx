import { REQUEST_STATUS, type RequestStatus } from '@/components/signature/status-dot';
import { Badge, type BadgeTone } from '@/components/ui/badge';

/** Ton du badge par statut (maquettes PAR-Demandes et PAR-Demande-Detail, charte Ciel produit). */
export const STATUS_TONE: Record<RequestStatus, BadgeTone> = {
  submitted: 'neutral',
  under_verification: 'info',
  info_requested: 'warn',
  ready_for_pickup: 'ok',
  collected: 'muted',
  rejected: 'err',
  cancelled: 'muted',
};

/** Statut d'une demande : pilule à point, toujours avec son libellé. */
export const RequestStatusBadge = ({ status, className }: { status: RequestStatus; className?: string }) => (
  <Badge tone={STATUS_TONE[status]} dot className={className}>
    {REQUEST_STATUS[status].label}
  </Badge>
);
