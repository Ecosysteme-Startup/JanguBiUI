'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { Verifications } from '@/features/users/components/verifications';
import { peut } from '@/lib/staff/capacites';

export default function ClergyValidationPage() {
  return (
    <AdminPageLayout
      title="Vérification des statuts"
      subtitle="Statuts cléricaux et consacrés déclarés, à vérifier"
      allow={peut('personnes.verifier')}
      width="lg"
    >
      <Verifications />
    </AdminPageLayout>
  );
}
