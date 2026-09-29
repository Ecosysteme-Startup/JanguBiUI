'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { ComptesClerge } from '@/features/clergy-accounts/components/comptes-clerge';
import { peut } from '@/lib/staff/capacites';

export default function ComptesClergePage() {
  return (
    <AdminPageLayout
      title="Validation du clergé"
      subtitle="Comptes de prêtres, diacres et religieux à vérifier avant d’ouvrir leur espace."
      allow={peut('comptes.valider')}
    >
      <ComptesClerge />
    </AdminPageLayout>
  );
}
