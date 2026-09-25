import { HorairesScreen } from '@/features/horaires/components/horaires-screen';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../capability-denied';

type Props = { params: Promise<{ nodeId: string }> };

const HorairesPage = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <RequireCapability capacite="horaires.gerer" nodeId={nodeId} fallback={<CapabilityDenied nodeId={nodeId} what="Horaires et lieux de culte" capacite="horaires.gerer" />}>
      <HorairesScreen nodeId={nodeId} />
    </RequireCapability>
  );
};

export default HorairesPage;
