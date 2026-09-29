import type { Metadata } from 'next';

import { CampaignEditor } from '@/features/dons/components/paroisse/campaign-editor';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../../../capability-denied';

export const metadata: Metadata = { title: 'Campagne' };

type Props = { params: Promise<{ nodeId: string; fundId: string }> };

const CampagnePage = async ({ params }: Props) => {
  const { nodeId: rawNodeId, fundId } = await params;
  const nodeId = decodeURIComponent(rawNodeId);
  return (
    <RequireCapability
      capacite="dons.gerer_fonds"
      nodeId={nodeId}
      fallback={<CapabilityDenied nodeId={nodeId} what="Campagnes" capacite="dons.gerer_fonds" />}
    >
      <CampaignEditor nodeId={nodeId} fundId={decodeURIComponent(fundId)} />
    </RequireCapability>
  );
};

export default CampagnePage;
