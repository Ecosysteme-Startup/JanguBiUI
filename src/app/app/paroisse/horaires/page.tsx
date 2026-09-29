'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { HorairesLieux } from '@/features/structure/components/horaires-lieux';
import { peut } from '@/lib/staff/capacites';

export default function Page() {
  return (
    <AdminPageLayout
      title="Horaires et lieux de culte"
      subtitle="Messes, confessions et adoration de la semaine type"
      allow={peut('horaires.gerer', 'structure.gerer')}
    >
      <HorairesLieux />
    </AdminPageLayout>
  );
}
