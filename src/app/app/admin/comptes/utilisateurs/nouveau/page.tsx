'use client';

import { CreerCompte } from '@/features/admin-comptes/components/creer-compte';
import { PageComptes } from '@/features/admin-comptes/components/page-comptes';

export default function AdminCompteCreerPage() {
  return (
    <PageComptes title="Nouveau compte" subtitle="Création et invitation">
      <CreerCompte />
    </PageComptes>
  );
}
