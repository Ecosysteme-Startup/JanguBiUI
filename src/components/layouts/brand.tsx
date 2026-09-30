import NextLink from 'next/link';

import { Logo } from '@/components/ui/logo';
import { cn } from '@/utils/cn';

const SIZES = {
  // barre latérale (WEB-FID-*) : logo 28, 20 px
  sm: { mark: 28, text: 'text-20', gap: 'gap-2.5' },
  // en-têtes publics, pied de page : logo 32, 22 px
  md: { mark: 32, text: 'text-22', gap: 'gap-2.5' },
  // connexion, écrans d'erreur : logo 40, 28 px
  lg: { mark: 40, text: 'text-28', gap: 'gap-3' },
} as const;

/**
 * Logotype : logo officiel (bleu de marque) + « Jàngu Bi » en Source Serif 4 600 (seul serif hors
 * Parole). Le logo est décoratif ici : le nom écrit suffit aux lecteurs d'écran.
 */
export const Logotype = ({ size = 'md', className }: { size?: keyof typeof SIZES; className?: string }) => (
  <span className={cn('inline-flex items-center', SIZES[size].gap, className)}>
    <Logo size={SIZES[size].mark} decorative />
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
    <Logotype size={size} />
  </NextLink>
);
