'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { ComptesPlateforme } from '@/features/users/components/comptes-plateforme';
import { peut } from '@/lib/staff/capacites';

export default function AdminUsersPage() {
  return (
    <AdminPageLayout
      title="Comptes"
      subtitle="Accès, MFA et sessions des comptes de la plateforme"
      allow={peut('plateforme.admin')}
    >
      <ComptesPlateforme />
    </AdminPageLayout>
  );
}
