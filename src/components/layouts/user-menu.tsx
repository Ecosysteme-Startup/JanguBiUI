'use client';

import NextLink from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { isMfaRequired } from '@/components/layouts/mfa-required-notice';
import { useSignOut } from '@/components/layouts/sign-out-button';
import { Icon } from '@/components/ui/icon';
import { iconButtonClasses } from '@/components/ui/icon-button';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/menu';
import { BACKOFFICE_LABEL, backofficeKindOf } from '@/config/nav';
import { paths } from '@/config/paths';
import { useContexts } from '@/lib/can';
import { cn } from '@/utils/cn';

/**
 * Menu du compte (bouton ⋮ de la carte utilisateur, WEB-FID-* « Réglages du compte ») :
 * profil et réglages, accès à l'espace responsable (titulaires d'office), affichage clair ou
 * sombre, déconnexion. `backofficeEntry` affiche le lien « Espace paroisse » (côté fidèle).
 */
export const UserMenu = ({
  profileHref = paths.app.profil.getHref(),
  backofficeEntry = false,
  className,
}: {
  profileHref?: string;
  backofficeEntry?: boolean;
  className?: string;
}) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === 'dark';
  const { signOut, pending } = useSignOut();
  const { contexts, error } = useContexts();
  // Titulaire d'office : au moins un contexte, ou refus `mfa_required` (rôle staff sans code saisi).
  const first = contexts[0];
  const spaceLabel = first ? BACKOFFICE_LABEL[backofficeKindOf(first.type)] : BACKOFFICE_LABEL.paroisse;
  const showBackoffice = backofficeEntry && (contexts.length > 0 || isMfaRequired(error));
  return (
    <Menu>
      <MenuTrigger aria-label="Réglages du compte" className={cn(iconButtonClasses({ size: 'sm' }), 'text-ink-2', className)}>
        <Icon name="plus-vertical" size={18} />
      </MenuTrigger>
      <MenuContent align="end" side="top">
        {showBackoffice && (
          <>
            <MenuItem icon="paroisse" asChild>
              <NextLink href={paths.espace.index.getHref()}>{spaceLabel}</NextLink>
            </MenuItem>
            <MenuSeparator />
          </>
        )}
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
