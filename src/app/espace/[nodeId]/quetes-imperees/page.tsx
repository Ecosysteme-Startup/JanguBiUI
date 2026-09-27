import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CapabilityPage } from '@/components/layouts/capability-page';
import { LoadingBlock } from '@/components/ui/skeleton';
import { QuetesImpereesPage } from '@/features/dons/components/diocese/quetes-imperees-page';

export const metadata: Metadata = { title: 'Quêtes impérées' };

type Props = { params: Promise<{ nodeId: string }> };

/** Quêtes impérées du diocèse (DIO-Quetes-Imperees). */
const Page = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <CapabilityPage capacite="dons.definir_quete_imperee" nodeId={nodeId}>
      <Suspense
        fallback={<LoadingBlock label="Chargement des quêtes impérées…" />}
      >
        <QuetesImpereesPage nodeId={nodeId} />
      </Suspense>
    </CapabilityPage>
  );
};

export default Page;
