'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { Nominations } from '@/features/structure/components/nominations';
import { peut } from '@/lib/staff/capacites';

export default function NominationsPage() {
  return (
    <AdminPageLayout
      title="Équipe et offices"
      subtitle="Nominations aux offices de la communauté"
      allow={peut('offices.nommer')}
    >
      <Nominations />
    </AdminPageLayout>
  );
}
