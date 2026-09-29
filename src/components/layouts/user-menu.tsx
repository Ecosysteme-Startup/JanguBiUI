'use client';

import NextLink from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { useSignOut } from '@/components/layouts/sign-out-button';
import { Icon } from '@/components/ui/icon';
import { iconButtonClasses } from '@/components/ui/icon-button';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/menu';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

/**
 * Menu du compte (bouton ⋮ de la carte utilisateur, WEB-FID-* « Réglages du compte ») :
 * profil et réglages, affichage clair ou sombre, déconnexion.
 */
export const UserMenu = ({ profileHref = paths.app.profil.getHref(), className }: { profileHref?: string; className?: string }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === 'dark';
  const { signOut, pending } = useSignOut();
  return (
    <Menu>
      <MenuTrigger aria-label="Réglages du compte" className={cn(iconButtonClasses({ size: 'sm' }), 'text-ink-2', className)}>
        <Icon name="plus-vertical" size={18} />
      </MenuTrigger>
      <MenuContent align="end" side="top">
        <MenuItem icon="profil" asChild>
          <NextLink href={profileHref}>Profil et réglages</NextLink>
        </MenuItem>
        <MenuItem icon={dark ? 'clair' : 'sombre'} onSelect={() => setTheme(dark ? 'light' : 'dark')}>
          {dark ? 'Affichage clair' : 'Affichage sombre'}
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon="deconnexion" disabled={pending} onSelect={() => void signOut()}>
          {pending ? 'Déconnexion…' : 'Se déconnecter'}
        </MenuItem>
      </MenuContent>
    </Menu>
  );
};
