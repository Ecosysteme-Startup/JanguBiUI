'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { Referentiels } from '@/features/structure/components/referentiels';
import { peut } from '@/lib/staff/capacites';

export default function ReferentielsPage() {
  return (
    <AdminPageLayout
      title="Référentiels"
      subtitle="Types de nœuds et catalogue des offices"
      allow={peut('plateforme.admin')}
    >
      <Referentiels />
    </AdminPageLayout>
  );
}
