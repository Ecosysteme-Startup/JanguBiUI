import NextLink from 'next/link';

import { cn } from '@/utils/cn';

type BrandProps = { href: string; subtitle: string; label: string; size?: 'lg' | 'md'; stacked?: boolean; className?: string };

/** « Jàngu Bi » en Source Serif + sous-titre (« La Leçon », « Espace fidèle »…). */
export const Brand = ({ href, subtitle, label, size = 'md', stacked, className }: BrandProps) => (
  <NextLink href={href} aria-label={label} className={cn('text-ink hover:text-ink', stacked ? 'block' : 'flex items-baseline gap-3', className)}>
    <span className={cn('block font-serif leading-none tracking-[-0.01em]', size === 'lg' ? 'text-[31px]' : 'text-[26px]')}>Jàngu Bi</span>
    <span className={cn('tnum block text-meta text-ink-3', stacked && 'mt-2')}>{subtitle}</span>
  </NextLink>
);
