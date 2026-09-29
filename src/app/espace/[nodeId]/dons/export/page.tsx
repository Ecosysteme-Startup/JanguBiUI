import type { Metadata } from 'next';

import { ExportScreen } from '@/features/dons/components/paroisse/export-screen';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../../capability-denied';

export const metadata: Metadata = { title: 'Exporter et rapprocher' };

type Props = { params: Promise<{ nodeId: string }> };

const ExportPage = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <RequireCapability
      capacite="dons.exporter"
      nodeId={nodeId}
      fallback={<CapabilityDenied nodeId={nodeId} what="Export des dons" capacite="dons.exporter" />}
    >
      <ExportScreen nodeId={nodeId} />
    </RequireCapability>
  );
};

export default ExportPage;
