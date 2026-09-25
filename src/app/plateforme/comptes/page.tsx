import type { Metadata } from 'next';

import { CapabilityPage } from '@/components/layouts/capability-page';
import { ComptesPage } from '@/features/comptes/components/comptes-page';

export const metadata: Metadata = { title: 'Comptes' };

/** Comptes du realm (PLA-Comptes). */
const Page = () => (
  <CapabilityPage capacite="plateforme.admin" nodeId={null}>
    <ComptesPage />
  </CapabilityPage>
);

export default Page;
