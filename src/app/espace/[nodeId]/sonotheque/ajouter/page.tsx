import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AjouterEnregistrements } from '@/features/sonotheque/components/staff/ajouter-enregistrements';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../../capability-denied';

export const metadata: Metadata = { title: 'Ajouter des enregistrements' };

type Props = { params: Promise<{ nodeId: string }> };

const AjouterEnregistrementsPage = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <RequireCapability
      capacite="audio.publier"
      nodeId={nodeId}
      fallback={
        <CapabilityDenied
          nodeId={nodeId}
          what="Sonothèque"
          capacite="audio.publier"
        />
      }
    >
      <Suspense>
        <AjouterEnregistrements nodeId={nodeId} />
      </Suspense>
    </RequireCapability>
  );
};

export default AjouterEnregistrementsPage;
