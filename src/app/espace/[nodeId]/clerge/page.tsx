import type { Metadata } from 'next';

import { CapabilityPage } from '@/components/layouts/capability-page';
import { ClergePage } from '@/features/clerge/components/clerge-page';

export const metadata: Metadata = { title: 'Clergé' };

type Props = { params: Promise<{ nodeId: string }> };

/** Clergé et vérifications (DIO-Clerge). */
const Page = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <CapabilityPage capacite="personnes.verifier" nodeId={nodeId}>
      <ClergePage />
    </CapabilityPage>
  );
};

export default Page;
