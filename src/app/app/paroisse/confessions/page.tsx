'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { ConfessionsStaff } from '@/features/structure/components/confessions-staff';
import { peut } from '@/lib/staff/capacites';

export default function Page() {
  return (
    <AdminPageLayout
      title="Confessions"
      subtitle="Créneaux récurrents et planning"
      allow={peut('confessions.gerer', 'confessions.voir_planning')}
    >
      <ConfessionsStaff />
    </AdminPageLayout>
  );
}
