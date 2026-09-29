'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { StaffActesFile } from '@/features/documents/components/staff-actes-file';
import { peut } from '@/lib/staff/capacites';

export default function AdminDocumentsPage() {
  return (
    <AdminPageLayout
      title="Demandes d’actes"
      subtitle="Traiter les demandes d’actes de la paroisse"
      allow={peut('actes.traiter')}
    >
      <StaffActesFile />
    </AdminPageLayout>
  );
}
