import { AnnonceEditor } from '@/features/annonces-edition/components/annonce-editor';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../../capability-denied';

type Props = { params: Promise<{ nodeId: string }> };

const NouvelleAnnoncePage = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <RequireCapability capacite="annonces.publier" nodeId={nodeId} fallback={<CapabilityDenied nodeId={nodeId} what="Annonces" capacite="annonces.publier" />}>
      <AnnonceEditor nodeId={nodeId} articleId={null} />
    </RequireCapability>
  );
};

export default NouvelleAnnoncePage;
