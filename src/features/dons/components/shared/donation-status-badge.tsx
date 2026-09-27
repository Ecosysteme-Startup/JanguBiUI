import { Badge } from '@/components/ui/badge';

import type { DonationStatus } from '../../types/schemas';
import { DONATION_STATUS } from '../../utils/format';

/** Statut de paiement (WEB-Design-System, « Statuts de paiement ») : toujours un libellé. */
export const DonationStatusBadge = ({ status }: { status: DonationStatus | undefined }) => {
  const s = DONATION_STATUS[status ?? 'initie'];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
};
