import { EquipeScreen } from '@/features/equipe/components/equipe-screen';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../capability-denied';

type Props = { params: Promise<{ nodeId: string }> };

/** Nommer : `offices.nommer` ; lecture seule : `tableau_bord.voir` (spec §2.3). */
const EquipePage = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <RequireCapability
      capacite={['offices.nommer', 'tableau_bord.voir']}
      nodeId={nodeId}
      fallback={<CapabilityDenied nodeId={nodeId} what="Équipe et nominations" capacite="offices.nommer ou tableau_bord.voir" />}
    >
      <EquipeScreen nodeId={nodeId} />
    </RequireCapability>
  );
};

export default EquipePage;
