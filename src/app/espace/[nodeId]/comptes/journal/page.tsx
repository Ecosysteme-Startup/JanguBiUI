import type { Metadata } from 'next';
import { Suspense } from 'react';

import { JournalComptes } from '@/features/admin-comptes/components/journal';
import { PageComptes } from '@/features/admin-comptes/components/page-comptes';

export const metadata: Metadata = { title: 'Journal d’audit' };

type Props = { params: Promise<{ nodeId: string }> };

const ComptesJournalPage = async ({ params }: Props) => {
  const p = await params;
  const nodeId = decodeURIComponent(p.nodeId);
  return (
    <PageComptes
      nodeId={nodeId}
      title="Journal d’audit"
      subtitle="Actions sur les comptes"
    >
      <Suspense>
        <JournalComptes />
      </Suspense>
    </PageComptes>
  );
};

export default ComptesJournalPage;
