import type { Metadata } from 'next';
import { Suspense } from 'react';

import { JournalComptes } from '@/features/admin-comptes/components/journal';
import { PageComptes } from '@/features/admin-comptes/components/page-comptes';

export const metadata: Metadata = { title: 'Journal d’audit' };

const ComptesJournalPage = () => (
  <PageComptes
    nodeId={null}
    title="Journal d’audit"
    subtitle="Actions sur les comptes"
  >
    <Suspense>
      <JournalComptes />
    </Suspense>
  </PageComptes>
);

export default ComptesJournalPage;
