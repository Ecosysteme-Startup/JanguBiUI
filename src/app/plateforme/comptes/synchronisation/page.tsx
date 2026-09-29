import type { Metadata } from 'next';

import { PageComptes } from '@/features/admin-comptes/components/page-comptes';
import { Synchronisation } from '@/features/admin-comptes/components/synchronisation';

export const metadata: Metadata = { title: 'Synchronisation' };

const ComptesSyncPage = () => (
  <PageComptes
    nodeId={null}
    title="Synchronisation"
    subtitle="Comptes Jàngu Bi et Keycloak"
  >
    <Synchronisation />
  </PageComptes>
);

export default ComptesSyncPage;
