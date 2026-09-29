import { CapabilityPage } from '@/components/layouts/capability-page';
import { NodeDashboardView } from '@/features/tableaux-de-bord/components/node-dashboard';

type Props = { params: Promise<{ nodeId: string }> };

/** Tableau de bord du nœud (PAR-/DIO-Tableau-de-bord). */
const EspaceHomePage = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <CapabilityPage capacite="tableau_bord.voir" nodeId={nodeId}>
      <NodeDashboardView nodeId={nodeId} />
    </CapabilityPage>
  );
};

export default EspaceHomePage;
