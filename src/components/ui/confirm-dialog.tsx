'use client';

import type * as React from 'react';

import { Button } from './button';
import { Modal } from './modal';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  pending?: boolean;
  tone?: 'primary' | 'danger';
};

/** Confirmation d'une action irréversible ou sensible (verrouiller, terminer, retirer). */
export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  onConfirm,
  pending = false,
  tone = 'primary',
}: ConfirmDialogProps) => (
  <Modal
    open={open}
    onOpenChange={onOpenChange}
    title={title}
    description={description}
    footer={
      <>
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={pending}>
          {pending ? 'Un instant…' : confirmLabel}
        </Button>
      </>
    }
  >
    {children}
  </Modal>
);
