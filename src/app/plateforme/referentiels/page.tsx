import type { Metadata } from 'next';

import { CapabilityPage } from '@/components/layouts/capability-page';
import { ReferentielsPage } from '@/features/referentiels/components/referentiels-page';
import { parseReferentielTab } from '@/features/referentiels/utils/tabs';

export const metadata: Metadata = { title: 'Référentiels' };

type Props = { searchParams: Promise<{ onglet?: string }> };

/** Référentiels (PLA-Referentiels) ; l'onglet actif est dans l'URL. */
const Page = async ({ searchParams }: Props) => {
  const { onglet } = await searchParams;
  const tab = parseReferentielTab(onglet);
  return (
    <CapabilityPage capacite="plateforme.admin" nodeId={null}>
      <ReferentielsPage tab={tab} />
    </CapabilityPage>
  );
};

export default Page;
