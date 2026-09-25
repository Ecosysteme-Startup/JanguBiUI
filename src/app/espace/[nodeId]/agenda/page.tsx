import { AgendaScreen } from '@/features/agenda-edition/components/agenda-screen';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../capability-denied';

type Props = { params: Promise<{ nodeId: string }> };

const AgendaPage = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <RequireCapability capacite="evenements.gerer" nodeId={nodeId} fallback={<CapabilityDenied nodeId={nodeId} what="Agenda" capacite="evenements.gerer" />}>
      <AgendaScreen nodeId={nodeId} />
    </RequireCapability>
  );
};

export default AgendaPage;
