'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { JournalAudit } from '@/features/structure/components/journal-audit';
import { peut } from '@/lib/staff/capacites';

export default function AuditPage() {
  return (
    <AdminPageLayout
      title="Journal d’audit"
      subtitle="Actions sensibles de votre périmètre"
      allow={peut('audit.voir')}
    >
      <JournalAudit />
    </AdminPageLayout>
  );
}
