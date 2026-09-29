import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoadingBlock } from '@/components/ui/skeleton';
import { CapabilityDenied } from '@/features/actes-traitement/components/capability-denied';
import { RequestProcessing } from '@/features/actes-traitement/components/request-processing';
import { RequireCapability } from '@/lib/can';

export const metadata: Metadata = { title: 'Traitement d’une demande' };

type Props = { params: Promise<{ nodeId: string; id: string }> };

const TraitementDemandePage = async ({ params }: Props) => {
  const { nodeId, id } = await params;
  const node = decodeURIComponent(nodeId);
  return (
    <RequireCapability capacite="actes.traiter" nodeId={node} fallback={<CapabilityDenied />}>
      <Suspense fallback={<LoadingBlock label="Chargement de la demande…" />}>
        <RequestProcessing nodeId={node} id={decodeURIComponent(id)} />
      </Suspense>
    </RequireCapability>
  );
};

export default TraitementDemandePage;
