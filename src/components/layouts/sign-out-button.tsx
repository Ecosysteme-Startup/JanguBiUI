'use client';

import { signOut } from 'next-auth/react';

import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

/** Déconnexion globale (session Auth.js + session Keycloak, F3). */
export const SignOutButton = ({ iconOnly, className }: { iconOnly?: boolean; className?: string }) => (
  <button
    type="button"
    onClick={() => signOut({ redirectTo: paths.home.getHref() })}
    aria-label={iconOnly ? 'Se déconnecter' : undefined}
    className={cn('hit inline-flex items-center gap-2 text-sm text-ink-2 hover:text-ink', className)}
  >
    <Icon name="deconnexion" size={18} />
    {!iconOnly && 'Se déconnecter'}
  </button>
);
