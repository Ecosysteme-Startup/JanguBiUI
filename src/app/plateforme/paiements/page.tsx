import type { Metadata } from 'next';

import { CapabilityPage } from '@/components/layouts/capability-page';
import { PaiementsPage } from '@/features/dons/components/plateforme/paiements-page';

export const metadata: Metadata = { title: 'Paiements' };

/** Santé de la liaison avec l'agrégateur de paiement (PLA-Paiements). */
const Page = () => (
  <CapabilityPage capacite="plateforme.admin" nodeId={null}>
    <PaiementsPage />
  </CapabilityPage>
);

export default Page;
