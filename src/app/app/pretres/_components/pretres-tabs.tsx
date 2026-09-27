import { SegmentedLinks } from '@/components/ui/segmented-control';
import { paths } from '@/config/paths';

/** Vue « Conversations » de /app/pretres (état d'URL, partageable). */
export const CONVERSATIONS_VIEW = 'conversations';
export const conversationsHref = () => `${paths.app.pretres.list.getHref()}?vue=${CONVERSATIONS_VIEW}`;

/** Bascule « Conversations / Prêtres joignables » (FID-Pretres, FID-Conversation). */
export const PretresTabs = ({
  current,
  size = 'sm',
  className,
}: {
  current: 'conversations' | 'pretres';
  size?: 'xs' | 'sm';
  className?: string;
}) => (
  <SegmentedLinks
    label="Affichage"
    size={size}
    block
    className={className}
    items={[
      { href: conversationsHref(), label: 'Conversations', active: current === 'conversations' },
      { href: paths.app.pretres.list.getHref(), label: 'Prêtres joignables', active: current === 'pretres' },
    ]}
  />
);
