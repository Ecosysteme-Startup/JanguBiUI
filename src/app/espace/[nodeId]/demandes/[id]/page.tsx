import type { Metadata } from 'next';

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
      <RequestProcessing nodeId={node} id={decodeURIComponent(id)} />
    </RequireCapability>
  );
};

export default TraitementDemandePage;
