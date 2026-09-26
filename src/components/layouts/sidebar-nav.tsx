'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import type * as React from 'react';

import { isActivePath } from '@/components/layouts/nav-link';
import { CountBadge } from '@/components/ui/badge';
import { Icon, type IconName } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

type SidebarLinkProps = {
  href: string;
  label: string;
  icon?: IconName;
  match?: 'exact' | 'prefix';
  /** Autres chemins où la rubrique est courante (Bible et Chapelet → « La Parole »). */
  aliases?: string[];
  badge?: { value: number; tone?: 'neutral' | 'unread'; label?: string };
};

/**
 * Rubrique de barre latérale (WEB-FID-*, WEB-PAR-*) : 40 px, rayon 10, 15 px ink2, icône 20 ink3 ;
 * courante : fond b50, texte b800 600, icône b600 ; survol surface2. Compteur 22 px à droite.
 */
export const SidebarLink = ({ href, label, icon, match, aliases = [], badge }: SidebarLinkProps) => {
  const pathname = usePathname() ?? '/';
  const active = isActivePath(pathname, href, match) || aliases.some((a) => isActivePath(pathname, a));
  return (
    <NextLink
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex min-h-10 items-center gap-3 rounded-10 px-3 text-15 transition-colors',
        active ? 'bg-tint-50 font-semibold text-tint-800 hover:text-tint-800' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
      )}
    >
      {icon && <Icon name={icon} size={20} className={cn('shrink-0', active ? 'text-primary' : 'text-ink-3')} />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge && badge.value > 0 && <CountBadge value={badge.value} tone={badge.tone} label={badge.label} />}
    </NextLink>
  );
};

/** Filet de séparation entre deux groupes de rubriques (12 px de marge). */
export const SidebarSeparator = () => <div role="separator" className="mx-3 my-3 h-px bg-line" />;

/** Colonne de la barre latérale : fond surface, filet à droite, 264 px, padding 20/16. */
export const SidebarFrame = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex min-h-full flex-col px-4 py-5', className)}>{children}</div>
);
