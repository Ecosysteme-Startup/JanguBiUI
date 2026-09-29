'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { TableauNoeudSection } from '@/features/dashboard/components/tableau-noeud';
import { peut } from '@/lib/staff/capacites';

// L'ancienne analytique (/v1/dashboards/analytics/) n'existe pas en V1 : la
// page montre le tableau de bord du nœud (/v1/dashboards/nodes/{id}/).
export default function AnalytiquePage() {
  return (
    <AdminPageLayout
      title="Tableau de bord"
      subtitle="Indicateurs agrégés, sans donnée nominative"
      allow={peut('tableau_bord.voir')}
    >
      <TableauNoeudSection />
    </AdminPageLayout>
  );
}
