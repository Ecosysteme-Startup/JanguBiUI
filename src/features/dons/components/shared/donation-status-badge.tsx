import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

import type { DonationStatus } from '../../types/schemas';
import { DONATION_STATUS } from '../../utils/format';

const PILL = 'inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-12 font-semibold';

/**
 * Statut de paiement (WEB-Design-System, « Dons et quêtes ») : toujours un libellé.
 * Initié : point encre sur surface-2 ; Remboursé : flèche retour ; Expiré : horloge, pilule cerclée.
 */
export const DonationStatusBadge = ({ status }: { status: DonationStatus | undefined }) => {
  const value = status ?? 'initie';
  const { label, tone } = DONATION_STATUS[value];
  if (value === 'rembourse') {
    return (
      <span className={cn(PILL, 'bg-surface-2 text-ink-3')}>
        <Icon name="annuler" size={14} strokeWidth={2.25} className="shrink-0" />
        {label}
      </span>
    );
  }
  if (value === 'expire') {
    return (
      <span className={cn(PILL, 'border border-line bg-paper text-ink-3')}>
        <Icon name="horloge" size={14} strokeWidth={2.25} className="shrink-0" />
        {label}
      </span>
    );
  }
  if (value === 'initie') {
    return (
      <span className={cn(PILL, 'gap-1.5 bg-surface-2 text-ink')}>
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-ink" />
        {label}
      </span>
    );
  }
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
};
