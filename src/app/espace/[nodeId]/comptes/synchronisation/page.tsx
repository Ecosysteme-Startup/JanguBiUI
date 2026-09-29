import type { Metadata } from 'next';

import { PageComptes } from '@/features/admin-comptes/components/page-comptes';
import { Synchronisation } from '@/features/admin-comptes/components/synchronisation';

export const metadata: Metadata = { title: 'Synchronisation' };

type Props = { params: Promise<{ nodeId: string }> };

const ComptesSyncPage = async ({ params }: Props) => {
  const p = await params;
  const nodeId = decodeURIComponent(p.nodeId);
  return (
    <PageComptes
      nodeId={nodeId}
      title="Synchronisation"
      subtitle="Comptes Jàngu Bi et Keycloak"
    >
      <Synchronisation />
    </PageComptes>
  );
};

export default ComptesSyncPage;
