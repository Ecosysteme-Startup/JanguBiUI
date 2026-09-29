import type { Metadata } from 'next';

import { PageComptes } from '@/features/admin-comptes/components/page-comptes';
import { TableauDeBordComptes } from '@/features/admin-comptes/components/tableau-de-bord';

export const metadata: Metadata = { title: 'Comptes' };

type Props = { params: Promise<{ nodeId: string }> };

const ComptesPage = async ({ params }: Props) => {
  const p = await params;
  const nodeId = decodeURIComponent(p.nodeId);
  return (
    <PageComptes
      nodeId={nodeId}
      title="Comptes"
      subtitle="Administration des comptes"
    >
      <TableauDeBordComptes />
    </PageComptes>
  );
};

export default ComptesPage;
