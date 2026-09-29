import type { Metadata } from 'next';

import { CreerCompte } from '@/features/admin-comptes/components/creer-compte';
import { PageComptes } from '@/features/admin-comptes/components/page-comptes';

export const metadata: Metadata = { title: 'Nouveau compte' };

type Props = { params: Promise<{ nodeId: string }> };

const CompteCreerPage = async ({ params }: Props) => {
  const p = await params;
  const nodeId = decodeURIComponent(p.nodeId);
  return (
    <PageComptes
      nodeId={nodeId}
      title="Nouveau compte"
      subtitle="Création et invitation"
    >
      <CreerCompte />
    </PageComptes>
  );
};

export default CompteCreerPage;
