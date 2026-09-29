'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { ApiError } from '@/lib/api-client';

import { useDeleteAccount } from '../api/delete-account';

export const CONFIRMATION_WORD = 'SUPPRIMER';

/** Confirmation forte : il faut recopier le mot SUPPRIMER. La suppression est irréversible. */
export const DeleteAccountDialog = ({ open, onOpenChange, onDeleted }: { open: boolean; onOpenChange: (open: boolean) => void; onDeleted: () => void }) => {
  const [typed, setTyped] = useState('');
  const remove = useDeleteAccount({ onSuccess: onDeleted });
  const confirmed = typed.trim() === CONFIRMATION_WORD;
  // 409 : nomination en cours ; le message du serveur explique quoi faire.
  const error = remove.error instanceof ApiError ? remove.error.message : remove.error ? 'La suppression a échoué. Réessayez.' : null;

  const close = (next: boolean) => {
    if (!next) {
      setTyped('');
      remove.reset();
    }
    onOpenChange(next);
  };

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title="Supprimer mon compte"
      description="Cette action est définitive. Elle ne peut pas être annulée."
      footer={
        <>
          <Button variant="secondary" onClick={() => close(false)}>
            Garder mon compte
          </Button>
          <Button variant="danger" disabled={!confirmed || remove.isPending} onClick={() => remove.mutate()}>
            {remove.isPending ? 'Suppression…' : 'Supprimer définitivement'}
          </Button>
        </>
      }
    >
      <ul className="m-0 flex flex-col gap-2 pl-5 text-15 text-ink-2">
        <li>Vos conversations avec les prêtres sont effacées.</li>
        <li>Vos demandes d’actes sont anonymisées ; vos rendez-vous et inscriptions sont libérés.</li>
        <li>Les registres paroissiaux ne sont pas modifiés.</li>
      </ul>
      <Field id="pf-delete-confirm" label={`Pour confirmer, tapez ${CONFIRMATION_WORD}`} className="mt-5">
        <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
      </Field>
      {error && (
        <p role="alert" className="m-0 mt-3 text-14 text-err">
          {error}
        </p>
      )}
    </Modal>
  );
};
