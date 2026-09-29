import type { Metadata } from 'next';

import { SonothequeStaff } from '@/features/sonotheque/components/staff/sonotheque-staff';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../capability-denied';

export const metadata: Metadata = { title: 'Sonothèque' };

type Props = { params: Promise<{ nodeId: string }> };

/** Sonothèque de la paroisse : albums, pistes, encodage, publication (capacité `audio.publier`). */
const SonothequePage = async ({ params }: Props) => {
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
      <SonothequeStaff nodeId={nodeId} />
    </RequireCapability>
  );
};

export default SonothequePage;
