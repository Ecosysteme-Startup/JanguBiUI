import NextLink from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

/**
 * Bandeau permanent, non masquable (RG « pas de confession par message »,
 * DS-Composants §08). Présent dans toute conversation.
 */
export const ConfessionNotice = ({ bookingHref, className }: { bookingHref: string; className?: string }) => (
  <div role="note" className={cn('flex flex-wrap items-center gap-4 rounded border border-line-strong bg-surface px-4 py-3.5', className)}>
    <Icon name="confession" size={24} className="shrink-0 text-ink" />
    <div className="min-w-[200px] flex-1">
      <p className="m-0 font-serif text-h4 italic leading-tight text-ink">La confession ne se fait pas par message.</p>
      <p className="m-0 mt-0.5 text-sm text-ink-2">Prenez rendez-vous avec un prêtre, en présentiel.</p>
    </div>
    <NextLink href={bookingHref} className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'hover:text-paper')}>
      Prendre rendez-vous
    </NextLink>
  </div>
);
