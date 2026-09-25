import { AnnonceEditor } from '@/features/annonces-edition/components/annonce-editor';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../../capability-denied';

type Props = { params: Promise<{ nodeId: string; id: string }> };

const AnnoncePage = async ({ params }: Props) => {
  const { nodeId: rawNodeId, id } = await params;
  const nodeId = decodeURIComponent(rawNodeId);
  return (
    <RequireCapability capacite="annonces.publier" nodeId={nodeId} fallback={<CapabilityDenied nodeId={nodeId} what="Annonces" capacite="annonces.publier" />}>
      <AnnonceEditor nodeId={nodeId} articleId={decodeURIComponent(id)} />
    </RequireCapability>
  );
};

export default AnnoncePage;
