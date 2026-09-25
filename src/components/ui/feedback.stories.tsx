import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';

import { Button } from './button';
import { EmptyState } from './empty-state';
import { Modal } from './modal';
import { Notice } from './notice';
import { LoadingBlock } from './skeleton';
import { toast } from './toast';

const meta: Meta = { title: 'Primitives/Retours' };
export default meta;

const ModalDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Rejeter
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Rejeter la demande JB-2026-00395 ?"
        description="Awa Faye sera prévenue. Motif : demande en double de JB-2026-00391."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger">Rejeter</Button>
          </>
        }
      />
    </>
  );
};

export const Tous: StoryObj = {
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      <Notice tone="warn" title="Complément demandé">
        Ajoutez la date exacte du baptême.
      </Notice>
      <Notice tone="err" title="Hors connexion">
        Votre message partira dès le retour du réseau.
      </Notice>
      <Notice tone="ok" title="Rendez-vous confirmé">
        Samedi 26 septembre, 16 h 20.
      </Notice>
      <Button variant="secondary" onClick={() => toast.ok('Annonce publiée, 214 fidèles notifiés.')}>
        Afficher un toast
      </Button>
      <ModalDemo />
      <EmptyState icon="document" title="Aucune demande en cours">
        Vos demandes d\u2019actes apparaîtront ici.
      </EmptyState>
      <LoadingBlock />
    </div>
  ),
};
