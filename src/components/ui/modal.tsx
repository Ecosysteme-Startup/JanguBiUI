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
  size?: 'md' | 'lg';
};

/**
 * Modale : seul composant avec une ombre (DS-Composants).
 *
 * Contrôlée (sans `Dialog.Trigger`) : Radix ne connaît pas le déclencheur et rendait le focus
 * à `body` à la fermeture (A11Y-05). On mémorise l'élément focalisé à l'ouverture et on le
 * restaure à la fermeture, s'il est toujours dans le document.
 */
export const Modal = ({ open, onOpenChange, title, description, children, footer, size = 'md' }: ModalProps) => {
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
        <Dialog.Overlay className="fixed inset-0 z-40 bg-night/60" />
        <Dialog.Content
          onOpenAutoFocus={rememberTrigger}
          onCloseAutoFocus={restoreFocus}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded border border-line-strong bg-paper shadow-modal',
            size === 'md' ? 'max-w-lg' : 'max-w-3xl',
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-6">
            <div>
              <Dialog.Title className="m-0 font-serif text-h3 font-normal text-ink">{title}</Dialog.Title>
              {description && <Dialog.Description className="m-0 mt-2 text-base text-ink-2">{description}</Dialog.Description>}
            </div>
            <Dialog.Close asChild>
              <IconButton icon="x" label="Fermer" />
            </Dialog.Close>
          </div>
          {children && <div className="overflow-y-auto px-6 py-5">{children}</div>}
          {footer && <div className="flex justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
