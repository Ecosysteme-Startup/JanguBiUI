'use client';

import { useSearchParams } from 'next/navigation';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { FeuilleIntentions } from '@/features/intentions/components/feuille-intentions';
import { peut } from '@/lib/staff/capacites';

export default function FeuilleIntentionsPage() {
  const params = useSearchParams();
  return (
    <AdminPageLayout
      title="Feuille des intentions"
      subtitle="À imprimer pour la sacristie."
      allow={peut('intentions.gerer')}
    >
      <FeuilleIntentions
        node={params.get('node') ?? ''}
        date={params.get('date') ?? ''}
      />
    </AdminPageLayout>
  );
}
