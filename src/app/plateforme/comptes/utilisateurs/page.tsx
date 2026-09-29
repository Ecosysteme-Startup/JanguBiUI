import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ListeComptes } from '@/features/admin-comptes/components/liste-comptes';
import { PageComptes } from '@/features/admin-comptes/components/page-comptes';

export const metadata: Metadata = { title: 'Tous les comptes' };

const ComptesListePage = () => (
  <PageComptes
    nodeId={null}
    title="Tous les comptes"
    subtitle="Comptes de votre périmètre"
  >
    <Suspense>
      <ListeComptes />
    </Suspense>
  </PageComptes>
);

export default ComptesListePage;
