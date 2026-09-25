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

/** Modale : seul composant avec une ombre (DS-Composants). */
export const Modal = ({ open, onOpenChange, title, description, children, footer, size = 'md' }: ModalProps) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-night/60" />
      <Dialog.Content
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
