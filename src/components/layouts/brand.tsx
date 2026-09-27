import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

const SIZES = {
  // barre latérale (WEB-FID-*) : pastille 30 rayon 8, 20 px
  sm: { mark: 'size-[30px] rounded-8', icon: 17, text: 'text-20', gap: 'gap-2.5' },
  // en-têtes publics : pastille 32 rayon 9, 22 px
  md: { mark: 'size-8 rounded-9', icon: 18, text: 'text-22', gap: 'gap-2.5' },
  // connexion : pastille 40 rayon 11, 28 px
  lg: { mark: 'size-10 rounded-[11px]', icon: 22, text: 'text-28', gap: 'gap-3' },
} as const;

/** Logotype : pastille b600 au livre ouvert + « Jàngu Bi » en Source Serif 4 600 (seul serif hors Parole). */
export const Logo = ({ size = 'md', className }: { size?: keyof typeof SIZES; className?: string }) => (
  <span className={cn('inline-flex items-center', SIZES[size].gap, className)}>
    <span className={cn('inline-flex shrink-0 items-center justify-center bg-primary-fill text-on-primary', SIZES[size].mark)}>
      <Icon name="parole" size={SIZES[size].icon} strokeWidth={2} />
    </span>
    <span className={cn('font-serif font-semibold leading-none tracking-[-0.01em] text-ink', SIZES[size].text)}>Jàngu Bi</span>
  </span>
);

type BrandProps = {
  href: string;
  label: string;
  size?: keyof typeof SIZES;
  /** @deprecated Sous-titre retiré de la charte Ciel ; ignoré. */
  subtitle?: string;
  /** @deprecated ignoré. */
  stacked?: boolean;
  className?: string;
};

/** Logotype cliquable (retour à l'accueil de l'espace). */
export const Brand = ({ href, label, size = 'md', className }: BrandProps) => (
  <NextLink href={href} aria-label={label} className={cn('inline-flex items-center text-ink hover:text-ink', className)}>
    <Logo size={size} />
  </NextLink>
);
