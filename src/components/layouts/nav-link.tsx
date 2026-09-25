'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

export const isActivePath = (pathname: string, href: string, match: 'exact' | 'prefix' = 'prefix') => {
  const target = href.split(/[?#]/)[0] || '/';
  if (match === 'exact') return pathname === target;
  return pathname === target || pathname.startsWith(`${target}/`);
};

type NavLinkProps = {
  href: string;
  match?: 'exact' | 'prefix';
  className?: string;
  activeClassName?: string;
  children: ReactNode;
  onClick?: () => void;
  'aria-label'?: string;
};

/** Lien de navigation : `aria-current="page"` sur la rubrique courante. */
export const NavLink = ({ href, match, className, activeClassName, children, ...rest }: NavLinkProps) => {
  const pathname = usePathname() ?? '/';
  const active = !href.includes('#') && isActivePath(pathname, href, match);
  return (
    <NextLink href={href} aria-current={active ? 'page' : undefined} className={cn(className, active && activeClassName)} {...rest}>
      {children}
    </NextLink>
  );
};
