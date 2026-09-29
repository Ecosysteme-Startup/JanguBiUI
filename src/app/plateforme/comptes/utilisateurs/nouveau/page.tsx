import type { Metadata } from 'next';

import { CreerCompte } from '@/features/admin-comptes/components/creer-compte';
import { PageComptes } from '@/features/admin-comptes/components/page-comptes';

export const metadata: Metadata = { title: 'Nouveau compte' };

const CompteCreerPage = () => (
  <PageComptes
    nodeId={null}
    title="Nouveau compte"
    subtitle="Création et invitation"
  >
    <CreerCompte />
  </PageComptes>
);

export default CompteCreerPage;
