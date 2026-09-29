'use client';

import { PageComptes } from '@/features/admin-comptes/components/page-comptes';
import { TableauDeBordComptes } from '@/features/admin-comptes/components/tableau-de-bord';

export default function AdminComptesPage() {
  return (
    <PageComptes title="Comptes" subtitle="Administration des comptes">
      <TableauDeBordComptes />
    </PageComptes>
  );
}
