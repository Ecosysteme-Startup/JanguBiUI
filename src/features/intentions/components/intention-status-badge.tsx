import { Badge, type BadgeTone } from '@/components/ui/badge';
import type { IconName } from '@/components/ui/icon';

/**
 * Statuts du contrat (`recue`, `planifiee`, `refusee`, `celebree`, `annulee`).
 * La couleur n'est jamais le seul signal : icône + libellé.
 */
export const INTENTION_STATUS_CONFIG: Record<
  string,
  { label: string; tone: BadgeTone; icon: IconName }
> = {
  recue: { label: 'En attente', tone: 'warn', icon: 'horloge' },
  planifiee: { label: 'Planifiée', tone: 'info', icon: 'calendrier-ok' },
  refusee: { label: 'Refusée', tone: 'err', icon: 'x' },
  celebree: { label: 'Célébrée', tone: 'ok', icon: 'check' },
  annulee: { label: 'Annulée', tone: 'muted', icon: 'hors-service' },
};

export function IntentionStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const config = INTENTION_STATUS_CONFIG[status];
  return (
    <Badge
      tone={config?.tone ?? 'neutral'}
      icon={config?.icon}
      className={className}
    >
      {config?.label ?? status}
    </Badge>
  );
}
