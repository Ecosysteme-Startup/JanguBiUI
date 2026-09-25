'use client';

import { Suspense, use } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { MessagerieInbox } from '@/features/messagerie/components/messagerie-inbox';
import { RequireCapability } from '@/lib/can';

type Props = { params: Promise<{ nodeId: string }> };

// Messagerie du prêtre (PAR-Messagerie) : capacité messagerie.recevoir_fideles.
const MessageriePage = ({ params }: Props) => {
  const nodeId = decodeURIComponent(use(params).nodeId);
  return (
    <RequireCapability
      capacite="messagerie.recevoir_fideles"
      nodeId={nodeId}
      fallback={
        <EmptyState
          icon="cadenas"
          title="La messagerie est réservée aux prêtres joignables"
        >
          Seuls les prêtres qui reçoivent les fidèles ont une messagerie. Le
          contenu des échanges n’est jamais visible par l’équipe.
        </EmptyState>
      }
    >
      <Suspense>
        <MessagerieInbox nodeId={nodeId} />
      </Suspense>
    </RequireCapability>
  );
};

export default MessageriePage;
