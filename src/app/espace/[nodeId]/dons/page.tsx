import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoadingBlock } from '@/components/ui/skeleton';
import { DonsScreen } from '@/features/dons/components/paroisse/dons-screen';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../capability-denied';

export const metadata: Metadata = { title: 'Dons et quêtes' };

type Props = { params: Promise<{ nodeId: string }> };

const DonsPage = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <RequireCapability
      capacite={['dons.voir_fonds', 'dons.gerer_fonds', 'dons.saisir_quete', 'dons.exporter']}
      nodeId={nodeId}
      fallback={<CapabilityDenied nodeId={nodeId} what="Dons et quêtes" capacite="dons.voir_fonds" />}
    >
      <Suspense fallback={<LoadingBlock label="Chargement des dons…" />}>
        <DonsScreen nodeId={nodeId} />
      </Suspense>
    </RequireCapability>
  );
};

export default DonsPage;
