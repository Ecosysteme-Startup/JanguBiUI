import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ListeComptes } from '@/features/admin-comptes/components/liste-comptes';
import { PageComptes } from '@/features/admin-comptes/components/page-comptes';

export const metadata: Metadata = { title: 'Tous les comptes' };

type Props = { params: Promise<{ nodeId: string }> };

const ComptesListePage = async ({ params }: Props) => {
  const p = await params;
  const nodeId = decodeURIComponent(p.nodeId);
  return (
    <PageComptes
      nodeId={nodeId}
      title="Tous les comptes"
      subtitle="Comptes de votre périmètre"
    >
      <Suspense>
        <ListeComptes />
      </Suspense>
    </PageComptes>
  );
};

export default ComptesListePage;
