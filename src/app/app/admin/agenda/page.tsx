'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { StaffAgenda } from '@/features/agenda/components/staff-agenda';
import { peut } from '@/lib/staff/capacites';

export default function AdminAgendaPage() {
  return (
    <AdminPageLayout
      title="Agenda"
      subtitle="Événements et inscriptions de la communauté"
      allow={peut('evenements.gerer')}
    >
      <StaffAgenda />
    </AdminPageLayout>
  );
}
