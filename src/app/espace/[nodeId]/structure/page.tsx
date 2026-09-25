import type { Metadata } from 'next';

import { CapabilityPage } from '@/components/layouts/capability-page';
import { StructurePage } from '@/features/structure/components/structure-page';

export const metadata: Metadata = { title: 'Structure' };

type Props = { params: Promise<{ nodeId: string }> };

/** Arbre des juridictions (DIO-Structure). */
const Page = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <CapabilityPage capacite="structure.gerer" nodeId={nodeId}>
      <StructurePage nodeId={nodeId} />
    </CapabilityPage>
  );
};

export default Page;
