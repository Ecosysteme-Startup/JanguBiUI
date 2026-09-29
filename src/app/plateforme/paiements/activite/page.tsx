import type { Metadata } from 'next';

import { CapabilityPage } from '@/components/layouts/capability-page';
import { PageHeader } from '@/components/ui/page-header';
import { SantePaiementsVue } from '@/features/dons-analyse/components/sante-paiements';

export const metadata: Metadata = { title: 'Activité des paiements' };

/** Activité des paiements de la plateforme : nombres, taux et délais, jamais de montant. */
const ActivitePaiementsPage = () => (
  <CapabilityPage capacite="plateforme.admin" nodeId={null}>
    <div className="flex flex-col gap-6">
      <PageHeader compact title="Activité des paiements" />
      <SantePaiementsVue />
    </div>
  </CapabilityPage>
);

export default ActivitePaiementsPage;
