'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as React from 'react';

import { cn } from '@/utils/cn';

import { IconButton } from './icon-button';

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** `md` 480, `lg` 720, `form` 600 (titre 22/600, pied en bande surface : PAR-Horaires, PAR-Equipe). */
  size?: 'md' | 'lg' | 'form';
  /** Aide à gauche du pied (`form`) : « Chaque mercredi et chaque vendredi. » */
  footerHint?: React.ReactNode;
};

/**
 * Dialogue (WEB-Design-System, « Dialogue de confirmation ») : 480 px max (720 en `lg`),
 * rayon 16, ombre menu, voile scrim, titre 18/600, texte 15 ink2, actions à droite
 * (l'action destructive en dernier).
 *
 * Contrôlée (sans `Dialog.Trigger`) : Radix ne connaît pas le déclencheur et rendait le focus
 * à `body` à la fermeture (A11Y-05). On mémorise l'élément focalisé à l'ouverture et on le
 * restaure à la fermeture, s'il est toujours dans le document.
 */
export const Modal = ({ open, onOpenChange, title, description, children, footer, footerHint, size = 'md' }: ModalProps) => {
  const returnFocusRef = React.useRef<HTMLElement | null>(null);
  const rememberTrigger = () => {
    // Appelé avant que Radix déplace le focus : l'élément actif est encore le déclencheur.
    const active = document.activeElement;
    returnFocusRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
  };
  const restoreFocus = (event: Event) => {
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    if (target?.isConnected) {
      event.preventDefault();
      target.focus();
    }
  };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim data-[state=open]:animate-jb-fade-in data-[state=closed]:animate-jb-fade-out" />
        <Dialog.Content
          onOpenAutoFocus={rememberTrigger}
          onCloseAutoFocus={restoreFocus}
          className={cn(
            'data-[state=open]:animate-jb-pop-in data-[state=closed]:animate-jb-pop-out fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-16 border border-line bg-paper p-6 shadow-menu focus:outline-none',
            { md: 'max-w-[480px]', lg: 'max-w-[720px]', form: 'max-w-[600px]' }[size],
            size === 'form' && 'overflow-hidden',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Dialog.Title className={cn('m-0 font-semibold text-ink', size === 'form' ? 'text-22' : 'text-18 leading-6')}>{title}</Dialog.Title>
              {description && <Dialog.Description className="m-0 mt-2 text-15 text-ink-2">{description}</Dialog.Description>}
            </div>
            <Dialog.Close asChild>
              <IconButton icon="x" label="Fermer" size="sm" className="-mt-1 rounded-8 text-ink-2" />
            </Dialog.Close>
          </div>
          {size === 'form' ? (
            // Le pied fait partie de la zone qui défile (collant en bas) : il peut vivre dans un <form>.
            <div className="-mx-6 -mb-6 mt-4 overflow-y-auto px-6 pb-6">
              {children}
              {footer && <ModalFooter hint={footerHint}>{footer}</ModalFooter>}
            </div>
          ) : (
            children && <div className="-mx-6 mt-4 overflow-y-auto px-6">{children}</div>
          )}
          {footer && size !== 'form' && <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

/**
 * Pied de dialogue en bande surface (taille `form`) : aide 13 ink3 à gauche, actions à droite.
 * À poser en dernier enfant d'un <form> rendu dans une modale `size="form"` (bouton submit dans le formulaire).
 */
export const ModalFooter = ({ hint, children, className }: { hint?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <div className={cn('sticky bottom-0 -mx-6 -mb-6 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-6 py-4', className)}>
    <div className="min-w-0 text-13 text-ink-3">{hint}</div>
    <div className="flex flex-wrap justify-end gap-2">{children}</div>
  </div>
);
