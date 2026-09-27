import type { Metadata } from 'next';

import { CashCollectionScreen } from '@/features/dons/components/paroisse/cash-collection-screen';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../../capability-denied';

export const metadata: Metadata = { title: 'Saisir une quête' };

type Props = { params: Promise<{ nodeId: string }> };

const QuetesPage = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <RequireCapability
      capacite="dons.saisir_quete"
      nodeId={nodeId}
      fallback={<CapabilityDenied nodeId={nodeId} what="Quêtes en espèces" capacite="dons.saisir_quete" />}
    >
      <CashCollectionScreen nodeId={nodeId} />
    </RequireCapability>
  );
};

export default QuetesPage;
