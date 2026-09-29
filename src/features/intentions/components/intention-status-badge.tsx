import { Ban, CalendarCheck, Clock, Sparkles, XCircle } from 'lucide-react';

import { StatusBadge, type StatusConfig } from '@/components/ui/status-badge';

/**
 * Statuts du contrat (`recue`, `planifiee`, `refusee`, `celebree`, `annulee`).
 * La couleur n'est jamais le seul signal : icône + libellé.
 */
export const INTENTION_STATUS_CONFIG: Record<string, StatusConfig> = {
  recue: { label: 'En attente', tone: 'warning', icon: <Clock /> },
  planifiee: { label: 'Planifiée', tone: 'info', icon: <CalendarCheck /> },
  refusee: { label: 'Refusée', tone: 'danger', icon: <XCircle /> },
  celebree: { label: 'Célébrée', tone: 'success', icon: <Sparkles /> },
  annulee: { label: 'Annulée', tone: 'neutral', icon: <Ban /> },
};

export function IntentionStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const config: StatusConfig = INTENTION_STATUS_CONFIG[status] ?? {
    label: status,
    tone: 'neutral',
  };
  return <StatusBadge {...config} className={className} />;
}
