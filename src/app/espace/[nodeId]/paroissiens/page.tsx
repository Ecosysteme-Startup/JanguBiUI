import type { Metadata } from 'next';

import { ParoissiensStaff } from '@/features/paroissiens/components/paroissiens-staff';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../capability-denied';

export const metadata: Metadata = { title: 'Paroissiens' };

type Props = { params: Promise<{ nodeId: string }> };

/** Paroissiens de la paroisse (donnée nominative) : retirer et rétablir un membre. */
const ParoissiensPage = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <RequireCapability
      capacite="paroissiens.gerer"
      nodeId={nodeId}
      fallback={
        <CapabilityDenied
          nodeId={nodeId}
          what="Paroissiens"
          capacite="paroissiens.gerer"
        />
      }
    >
      <ParoissiensStaff nodeId={nodeId} />
    </RequireCapability>
  );
};

export default ParoissiensPage;
