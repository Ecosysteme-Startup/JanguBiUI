'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { Structure } from '@/features/structure/components/structure';
import { peut } from '@/lib/staff/capacites';

export default function AdminOrgPage() {
  return (
    <AdminPageLayout
      title="Structure"
      subtitle="Zones, doyennés, paroisses et communautés"
      allow={peut('structure.gerer')}
    >
      <Structure />
    </AdminPageLayout>
  );
}
