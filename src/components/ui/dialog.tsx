'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as React from 'react';

import { cn } from '@/utils/cn';

import { IconButton } from './icon-button';

/**
 * Dialogue composable (même rendu que <Modal>, WEB-Design-System « Dialogue ») pour les formulaires
 * qui ont besoin de placer eux-mêmes titre, corps et pied : 480 px max, rayon 16, voile scrim,
 * titre 18/600, texte 15 ink2, actions à droite. Préférer <Modal> pour un dialogue simple.
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-scrim data-[state=open]:animate-jb-fade-in data-[state=closed]:animate-jb-fade-out" />
    <DialogPrimitive.Content
      className={cn(
        'data-[state=open]:animate-jb-pop-in data-[state=closed]:animate-jb-pop-out fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-32px)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-16 border border-line bg-paper p-6 text-ink shadow-menu focus:outline-none',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close asChild>
        <IconButton
          icon="x"
          label="Fermer"
          size="sm"
          className="absolute right-4 top-4 rounded-8 text-ink-2"
        />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

export const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2 pr-8', className)} {...props} />
);

export const DialogTitle = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    className={cn('m-0 text-18 font-semibold leading-6 text-ink', className)}
    {...props}
  />
);

export const DialogDescription = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    className={cn('m-0 text-15 text-ink-2', className)}
    {...props}
  />
);

export const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('mt-1 flex flex-wrap justify-end gap-2', className)}
    {...props}
  />
);
