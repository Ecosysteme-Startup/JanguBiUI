import type { Metadata } from 'next';

import { CapabilityPage } from '@/components/layouts/capability-page';
import { REFERENTIEL_TABS, type ReferentielTab, ReferentielsPage } from '@/features/referentiels/components/referentiels-page';

export const metadata: Metadata = { title: 'Référentiels' };

type Props = { searchParams: Promise<{ onglet?: string }> };

/** Référentiels (PLA-Referentiels) ; l'onglet actif est dans l'URL. */
const Page = async ({ searchParams }: Props) => {
  const { onglet } = await searchParams;
  const tab = (REFERENTIEL_TABS as readonly string[]).includes(onglet ?? '') ? (onglet as ReferentielTab) : 'offices';
  return (
    <CapabilityPage capacite="plateforme.admin" nodeId={null}>
      <ReferentielsPage tab={tab} />
    </CapabilityPage>
  );
};

export default Page;
