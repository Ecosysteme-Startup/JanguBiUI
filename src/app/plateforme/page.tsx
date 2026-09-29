import { CapabilityPage } from '@/components/layouts/capability-page';
import { PlatformDashboardView } from '@/features/tableaux-de-bord/components/platform-dashboard';

/** Tableau de bord plateforme (PLA-Tableau-de-bord). */
const PlateformeHomePage = () => (
  <CapabilityPage capacite="plateforme.admin" nodeId={null}>
    <PlatformDashboardView />
  </CapabilityPage>
);

export default PlateformeHomePage;
