'use client';

import { PageComptes } from '@/features/admin-comptes/components/page-comptes';
import { Synchronisation } from '@/features/admin-comptes/components/synchronisation';

export default function AdminComptesSyncPage() {
  return (
    <PageComptes title="Synchronisation" subtitle="Comptes Jàngu Bi et Keycloak">
      <Synchronisation />
    </PageComptes>
  );
}
