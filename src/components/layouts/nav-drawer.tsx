'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { type MouseEvent, type ReactNode, useState } from 'react';

import { Icon } from '@/components/ui/icon';

/**
 * Navigation sous 1024 px (A11Y-06) : la barre latérale passe dans un tiroir derrière un bouton
 * « Menu » de la barre supérieure, pour que le contenu arrive en premier. Radix Dialog : focus
 * piégé, Échap ferme, focus rendu au bouton. Un clic sur un lien referme le tiroir (y compris dans
 * un menu rendu en portail mais présent dans l'arbre React).
 */
export const NavDrawer = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const closeOnLink = (event: MouseEvent) => {
    if ((event.target as Element).closest('a[href]')) setOpen(false);
  };
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="hit inline-flex h-10 items-center gap-2 rounded-10 border border-line bg-paper px-3 text-14 font-semibold text-ink hover:border-line-field hover:bg-surface lg:hidden">
        <Icon name="menu" size={18} />
        Menu
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim" />
        <Dialog.Content
          onClick={closeOnLink}
          className="fixed inset-y-0 left-0 z-50 flex w-[min(300px,calc(100vw-48px))] flex-col overflow-y-auto border-r border-line bg-surface shadow-menu focus:outline-none"
        >
          <div className="flex items-center justify-between px-4 pt-3">
            <Dialog.Title className="m-0 px-2 text-14 font-semibold text-ink">Menu</Dialog.Title>
            <Dialog.Close
              aria-label="Fermer le menu"
              className="inline-flex size-11 items-center justify-center rounded-10 text-ink hover:bg-surface-2"
            >
              <Icon name="x" size={20} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Rubriques de cet espace et compte</Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
