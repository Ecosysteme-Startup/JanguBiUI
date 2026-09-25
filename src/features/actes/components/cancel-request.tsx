'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';

import { useCancelRequest } from '../api/cancel-request';
import type { DocumentRequest } from '../types/request';

/** EF-ACT-07 : annulation par le fidèle, confirmée dans une modale. */
export const CancelRequest = ({ request, parish }: { request: DocumentRequest; parish: string }) => {
  const [open, setOpen] = useState(false);
  const cancel = useCancelRequest({
    onSuccess: () => {
      setOpen(false);
      toast.ok('Demande annulée.');
    },
  });

  return (
    <section aria-labelledby="sv-annuler" className="border-t border-line pt-5">
      <h2 id="sv-annuler" className="m-0 text-base font-semibold text-ink">
        Annuler la demande
      </h2>
      <p className="m-0 mt-2 text-sm text-ink-2">Possible tant que la paroisse n’a pas commencé la vérification, ou pendant un complément. Le secrétariat de {parish} en sera informé.</p>
      <Button variant="danger" size="sm" className="mt-4" onClick={() => setOpen(true)}>
        Annuler la demande
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Annuler cette demande ?"
        description={`${request.reference} ne sera plus traitée par ${parish}. Vous pourrez en déposer une nouvelle.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Garder la demande
            </Button>
            <Button variant="danger" disabled={cancel.isPending} onClick={() => cancel.mutate(request.id)}>
              {cancel.isPending ? 'Annulation…' : 'Confirmer l’annulation'}
            </Button>
          </>
        }
      >
        {cancel.error && (
          <Notice tone="err" title="L’annulation n’a pas abouti.">
            {cancel.error.message}
          </Notice>
        )}
      </Modal>
    </section>
  );
};
