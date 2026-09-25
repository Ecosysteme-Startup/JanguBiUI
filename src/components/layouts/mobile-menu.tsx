'use client';

import * as Dialog from '@radix-ui/react-dialog';
import NextLink from 'next/link';
import { useState } from 'react';

import { SignOutButton } from '@/components/layouts/sign-out-button';
import { ThemeToggle } from '@/components/layouts/theme-toggle';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { MOBILE_MENU } from '@/config/nav';
import { paths } from '@/config/paths';
import { displayName, useMe } from '@/hooks/use-me';

/** Menu « Plus » (MOB-Menu) : profil, rubriques numérotées, déconnexion. */
export const MobileMenu = () => {
  const [open, setOpen] = useState(false);
  const { data: me } = useMe();
  const name = displayName(me);
  const close = () => setOpen(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Ouvrir le menu"
        className="inline-flex size-11 items-center justify-center rounded text-ink hover:bg-surface-2"
      >
        <Icon name="menu" size={24} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-paper px-4 pb-24 pt-4 focus:outline-none">
          <div className="flex items-center justify-between">
            <Dialog.Title className="m-0 font-serif text-h2 font-normal text-ink">Menu</Dialog.Title>
            <Dialog.Close aria-label="Fermer le menu" className="inline-flex size-11 items-center justify-center rounded text-ink hover:bg-surface-2">
              <Icon name="x" size={22} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Toutes les rubriques de votre espace</Dialog.Description>
          {me && (
            <NextLink href={paths.app.profil.getHref()} onClick={close} className="mt-6 flex items-center gap-3 border-y border-line py-4 text-ink">
              <Avatar name={name.full} size={44} />
              <span className="flex flex-col">
                <span className="text-base font-medium">{name.full}</span>
                {me.paroisse_suivie && <span className="text-sm text-ink-3">Paroisse suivie : {me.paroisse_suivie.name}</span>}
              </span>
            </NextLink>
          )}
          <nav aria-label="Menu complet" className="mt-2">
            {MOBILE_MENU.map((section, index) => (
              <div key={section.title} className="mt-6">
                <p className="tnum m-0 text-meta text-ink-3">
                  {String(index + 1).padStart(2, '0')} — {section.title}
                </p>
                <ul className="m-0 mt-2 list-none p-0">
                  {section.items.map((item) => (
                    <li key={item.label} className="border-b border-line">
                      <NextLink href={item.href} onClick={close} className="flex min-h-13 items-center justify-between text-base text-ink">
                        {item.label}
                        <Icon name="chevron-droite" size={18} />
                      </NextLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="mt-8 flex items-center justify-between">
            <SignOutButton />
            <ThemeToggle />
          </div>
          <p className="tnum mt-8 text-meta text-ink-3">Jàngu Bi 1.0 · Numerisen</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
