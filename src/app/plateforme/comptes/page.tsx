import type { Metadata } from 'next';

import { PageComptes } from '@/features/admin-comptes/components/page-comptes';
import { TableauDeBordComptes } from '@/features/admin-comptes/components/tableau-de-bord';

export const metadata: Metadata = { title: 'Comptes' };

const ComptesPage = () => (
  <PageComptes
    nodeId={null}
    title="Comptes"
    subtitle="Administration des comptes"
  >
    <TableauDeBordComptes />
  </PageComptes>
);

export default ComptesPage;
