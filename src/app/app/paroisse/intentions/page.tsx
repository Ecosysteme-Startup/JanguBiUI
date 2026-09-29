'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { IntentionsParoisse } from '@/features/intentions/components/intentions-paroisse';
import { peut } from '@/lib/staff/capacites';

export default function IntentionsParoissePage() {
  return (
    <AdminPageLayout
      title="Intentions de messe"
      subtitle="Planifiez les intentions reçues."
      allow={peut('intentions.gerer')}
    >
      <IntentionsParoisse />
    </AdminPageLayout>
  );
}
