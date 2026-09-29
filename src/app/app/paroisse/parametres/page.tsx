'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { Parametres } from '@/features/structure/components/parametres';
import { peut } from '@/lib/staff/capacites';

export default function Page() {
  return (
    <AdminPageLayout
      title="Paramètres"
      subtitle="Secrétariat, délais des actes et messagerie"
      allow={peut('horaires.gerer', 'structure.gerer', 'messagerie.recevoir_fideles')}
    >
      <Parametres />
    </AdminPageLayout>
  );
}
