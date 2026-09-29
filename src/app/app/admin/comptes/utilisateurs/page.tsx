'use client';

import { Suspense } from 'react';

import { ListeComptes } from '@/features/admin-comptes/components/liste-comptes';
import { PageComptes } from '@/features/admin-comptes/components/page-comptes';

export default function AdminComptesListePage() {
  return (
    <PageComptes title="Tous les comptes" subtitle="Comptes de votre périmètre">
      <Suspense>
        <ListeComptes />
      </Suspense>
    </PageComptes>
  );
}
