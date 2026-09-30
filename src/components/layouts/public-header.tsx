'use client';

import * as Dialog from '@radix-ui/react-dialog';
import NextLink from 'next/link';
import { useState } from 'react';

import { Brand } from '@/components/layouts/brand';
import { NavLink } from '@/components/layouts/nav-link';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';

const LINKS = [
  { label: 'La Parole du jour', href: paths.parole.getHref() },
  { label: 'Paroisses', href: paths.paroisses.list.getHref() },
  { label: 'Pour les paroisses', href: paths.pourLesParoisses.getHref() },
  { label: 'Aide', href: paths.aide.getHref() },
];

const navLinkClass = 'inline-flex h-10 items-center rounded-10 px-3.5 text-15 font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink';

/**
 * En-tête public (WEB-Accueil, WEB-Erreur-404) : 72 px, filet bas, contenu 1200 ; logotype, quatre
 * liens (page courante sur fond surface), « Se connecter » en contour et « Créer un compte » en
 * primaire. Sous 1024 px, les liens passent dans un menu.
 */
export const PublicHeader = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b border-line bg-paper">
      <div className="jb-container flex h-18 items-center justify-between gap-8">
        <div className="flex items-center gap-10">
          <Brand href={paths.home.getHref()} label="Jàngu Bi, accueil" />
          <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <NavLink key={link.label} href={link.href} className={navLinkClass} activeClassName="bg-surface text-ink">
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <NextLink prefetch={false} href={paths.auth.connexion.getHref()}>Se connecter</NextLink>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <NextLink prefetch={false} href={paths.auth.inscription.getHref()}>Créer un compte</NextLink>
          </Button>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger className="hit inline-flex size-10 items-center justify-center rounded-10 border border-line text-ink hover:bg-surface lg:hidden" aria-label="Ouvrir le menu">
              <Icon name="menu" size={20} />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim data-[state=open]:animate-jb-fade-in data-[state=closed]:animate-jb-fade-out" />
              <Dialog.Content className="fixed inset-x-0 top-0 z-50 data-[state=open]:animate-jb-drop-in data-[state=closed]:animate-jb-drop-out border-b border-line bg-paper px-4 pb-6 pt-3 shadow-menu focus:outline-none">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="m-0 text-15 font-semibold text-ink">Menu</Dialog.Title>
                  <Dialog.Close aria-label="Fermer le menu" className="inline-flex size-11 items-center justify-center rounded-10 text-ink hover:bg-surface-2">
                    <Icon name="x" size={20} />
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">Pages publiques et accès au compte</Dialog.Description>
                <nav aria-label="Menu" className="mt-2 flex flex-col">
                  {LINKS.map((link) => (
                    <NavLink
                      key={link.label}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center rounded-10 px-3 text-16 font-medium text-ink-2 hover:bg-surface hover:text-ink"
                      activeClassName="bg-surface text-ink"
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </nav>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" size="lg">
                    <NextLink prefetch={false} href={paths.auth.connexion.getHref()}>Se connecter</NextLink>
                  </Button>
                  <Button asChild size="lg">
                    <NextLink prefetch={false} href={paths.auth.inscription.getHref()}>Créer un compte</NextLink>
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
};
