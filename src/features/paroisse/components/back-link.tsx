import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';

/** Retour discret en tête de page de détail (« ‹ Toutes les annonces »), 15/500 primaire. */
export const BackLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <NextLink href={href} className="hit inline-flex items-center gap-1 text-15 font-medium text-primary hover:text-primary-strong">
    <Icon name="chevron-gauche" size={18} />
    {children}
  </NextLink>
);
