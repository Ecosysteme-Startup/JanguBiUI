import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoadingBlock } from '@/components/ui/skeleton';
import { CapabilityDenied } from '@/features/actes-traitement/components/capability-denied';
import { QueueView } from '@/features/actes-traitement/components/queue-view';
import { RequireCapability } from '@/lib/can';

export const metadata: Metadata = { title: 'Demandes d’actes' };

type Props = { params: Promise<{ nodeId: string }> };

const FileDemandesPage = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <RequireCapability capacite="actes.traiter" nodeId={nodeId} fallback={<CapabilityDenied />}>
      <Suspense fallback={<LoadingBlock label="Chargement de la file…" />}>
        <QueueView nodeId={nodeId} />
      </Suspense>
    </RequireCapability>
  );
};

export default FileDemandesPage;
