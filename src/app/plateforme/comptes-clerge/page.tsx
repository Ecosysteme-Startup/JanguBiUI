import type { Metadata } from 'next';

import { CapabilityPage } from '@/components/layouts/capability-page';
import { PageHeader } from '@/components/ui/page-header';
import { ComptesClerge } from '@/features/clergy-accounts/components/comptes-clerge';

export const metadata: Metadata = { title: 'Comptes du clergé' };

const ComptesClergePlateformePage = () => (
  <CapabilityPage capacite="plateforme.admin" nodeId={null}>
    <div className="flex flex-col gap-6">
      <PageHeader
        compact
        title="Comptes du clergé"
        description="Invitez, validez et activez les comptes des prêtres, diacres et consacrés."
      />
      <ComptesClerge />
    </div>
  </CapabilityPage>
);

export default ComptesClergePlateformePage;
