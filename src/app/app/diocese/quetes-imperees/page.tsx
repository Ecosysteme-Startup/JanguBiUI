'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { QuetesImperees } from '@/features/dons-staff/components/quetes-imperees';
import { peut } from '@/lib/staff/capacites';

export default function Page() {
  return (
    <AdminPageLayout
      title="Quêtes impérées"
      subtitle="Définir, suivre les remises et les reversements"
      allow={peut('dons.definir_quete_imperee')}
    >
      <QuetesImperees />
    </AdminPageLayout>
  );
}
