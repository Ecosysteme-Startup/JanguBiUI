import { AnnoncesList } from '@/features/annonces-edition/components/annonces-list';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../capability-denied';

type Props = { params: Promise<{ nodeId: string }> };

const AnnoncesPage = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <RequireCapability capacite="annonces.publier" nodeId={nodeId} fallback={<CapabilityDenied nodeId={nodeId} what="Annonces" capacite="annonces.publier" />}>
      <AnnoncesList nodeId={nodeId} />
    </RequireCapability>
  );
};

export default AnnoncesPage;
