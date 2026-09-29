import type { Metadata } from 'next';

import { CampaignEditor } from '@/features/dons/components/paroisse/campaign-editor';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../../../capability-denied';

export const metadata: Metadata = { title: 'Nouvelle campagne' };

type Props = { params: Promise<{ nodeId: string }> };

const NouvelleCampagnePage = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <RequireCapability
      capacite="dons.gerer_fonds"
      nodeId={nodeId}
      fallback={<CapabilityDenied nodeId={nodeId} what="Campagnes" capacite="dons.gerer_fonds" />}
    >
      <CampaignEditor nodeId={nodeId} />
    </RequireCapability>
  );
};

export default NouvelleCampagnePage;
