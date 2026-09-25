'use client';

import { useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

/** Déconnexion globale : session Auth.js supprimée côté serveur, puis fin de session Keycloak. */
export const SignOutButton = ({ iconOnly, className }: { iconOnly?: boolean; className?: string }) => {
  const [pending, setPending] = useState(false);
  const signOut = async () => {
    setPending(true);
    try {
      const response = await fetch('/deconnexion', { method: 'POST' });
      const { redirectTo } = (await response.json()) as { redirectTo?: string };
      window.location.assign(redirectTo ?? paths.home.getHref());
    } catch {
      window.location.assign(paths.home.getHref());
    }
  };
  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      aria-label={iconOnly ? 'Se déconnecter' : undefined}
      className={cn('hit inline-flex items-center gap-2 text-sm text-ink-2 hover:text-ink disabled:opacity-60', className)}
    >
      <Icon name="deconnexion" size={18} />
      {!iconOnly && (pending ? 'Déconnexion…' : 'Se déconnecter')}
    </button>
  );
};
