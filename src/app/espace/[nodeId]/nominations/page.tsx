import type { Metadata } from 'next';

import { CapabilityPage } from '@/components/layouts/capability-page';
import { NominationsPage } from '@/features/nominations/components/nominations-page';

export const metadata: Metadata = { title: 'Nominations' };

type Props = { params: Promise<{ nodeId: string }> };

/** Nominations et import du mouvement (DIO-Nominations). */
const Page = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <CapabilityPage capacite="offices.nommer" nodeId={nodeId}>
      <NominationsPage nodeId={nodeId} />
    </CapabilityPage>
  );
};

export default Page;
