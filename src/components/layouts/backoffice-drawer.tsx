'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { type MouseEvent, type ReactNode, useState } from 'react';

import { Icon } from '@/components/ui/icon';

/**
 * Navigation du back-office sous 1024 px (A11Y-06) : la sidebar passe dans un tiroir
 * derrière un bouton « Menu », pour que le contenu arrive en premier. Radix Dialog :
 * focus piégé, Échap ferme, focus rendu au bouton. Un clic sur un lien referme le tiroir
 * (y compris dans le sélecteur de contexte, rendu en portail mais dans l'arbre React).
 */
export const BackofficeDrawer = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const closeOnLink = (event: MouseEvent) => {
    if ((event.target as Element).closest('a[href]')) setOpen(false);
  };
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="inline-flex min-h-11 items-center gap-2 rounded border border-line-field px-3 text-sm font-medium text-ink hover:border-ink lg:hidden">
        <Icon name="menu" size={20} />
        Menu
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-night/60" />
        <Dialog.Content
          onClick={closeOnLink}
          className="fixed inset-y-0 left-0 z-50 flex w-[min(320px,calc(100vw-48px))] flex-col overflow-y-auto border-r border-line-strong bg-surface px-4 pb-4 pt-3 shadow-modal focus:outline-none"
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="m-0 px-3 text-sm font-semibold text-ink">Menu</Dialog.Title>
            <Dialog.Close
              aria-label="Fermer le menu"
              className="inline-flex size-11 items-center justify-center rounded text-ink hover:bg-surface-2"
            >
              <Icon name="x" size={22} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Rubriques de cet espace, contexte et compte</Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
