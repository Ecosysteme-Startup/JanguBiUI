'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { broadcastLogout } from '@/lib/logout-channel';
import { cn } from '@/utils/cn';

/** Déconnexion globale : session Auth.js supprimée côté serveur, puis fin de session Keycloak. */
export const useSignOut = () => {
  const [pending, setPending] = useState(false);
  const queryClient = useQueryClient();
  const signOut = async () => {
    setPending(true);
    // Prévenir les autres onglets et purger le cache local : plus aucune donnée de la session close.
    broadcastLogout();
    queryClient.clear();
    try {
      const response = await fetch('/deconnexion', { method: 'POST' });
      const { redirectTo } = (await response.json()) as { redirectTo?: string };
      window.location.assign(redirectTo ?? paths.home.getHref());
    } catch {
      window.location.assign(paths.home.getHref());
    }
  };
  return { signOut, pending };
};

export const SignOutButton = ({ iconOnly, className }: { iconOnly?: boolean; className?: string }) => {
  const { signOut, pending } = useSignOut();
  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      aria-label={iconOnly ? 'Se déconnecter' : undefined}
      className={cn('hit inline-flex items-center gap-2 text-14 text-ink-2 hover:text-ink disabled:opacity-60', className)}
    >
      <Icon name="deconnexion" size={18} />
      {!iconOnly && (pending ? 'Déconnexion…' : 'Se déconnecter')}
    </button>
  );
};
