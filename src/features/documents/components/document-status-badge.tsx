import {
  Ban,
  CheckCircle2,
  FileCheck2,
  Info,
  PackageCheck,
  Search,
  Send,
  XCircle,
} from 'lucide-react';

import { StatusBadge, type StatusConfig } from '@/components/ui/status-badge';

import { DocumentStatus } from '../types';

/**
 * Mapping unique statut → libellé/ton/icône, réutilisé par le badge, le liseré
 * de carte (documents-list) et la timeline d'historique (document-detail).
 */
export const DOCUMENT_STATUS_CONFIG: Record<DocumentStatus, StatusConfig> = {
  submitted: { label: 'Soumise', tone: 'info', icon: <Send /> },
  under_verification: {
    label: 'En vérification',
    tone: 'warning',
    icon: <Search />,
  },
  validated: { label: 'Validé', tone: 'success', icon: <CheckCircle2 /> },
  document_deposited: {
    label: 'Déposé',
    tone: 'progress',
    icon: <FileCheck2 />,
  },
  info_requested: {
    label: 'Complément demandé',
    tone: 'accent',
    icon: <Info />,
  },
  ready_for_pickup: {
    label: 'Prêt à retirer',
    tone: 'success',
    icon: <CheckCircle2 />,
  },
  collected: { label: 'Retiré', tone: 'progress', icon: <PackageCheck /> },
  rejected: { label: 'Refusée', tone: 'danger', icon: <XCircle /> },
  cancelled: { label: 'Annulée', tone: 'neutral', icon: <Ban /> },
};

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export function DocumentStatusBadge({
  status,
  className,
}: DocumentStatusBadgeProps) {
  return (
    <StatusBadge {...DOCUMENT_STATUS_CONFIG[status]} className={className} />
  );
}
