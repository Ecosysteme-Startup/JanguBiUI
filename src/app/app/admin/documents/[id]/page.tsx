'use client';

import { useParams } from 'next/navigation';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { StaffActeDetail } from '@/features/documents/components/staff-acte-detail';
import { peut } from '@/lib/staff/capacites';

export default function AdminDocumentPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <AdminPageLayout
      title="Demande d’acte"
      allow={peut('actes.traiter')}
      width="full"
    >
      <StaffActeDetail acteId={id} />
    </AdminPageLayout>
  );
}
