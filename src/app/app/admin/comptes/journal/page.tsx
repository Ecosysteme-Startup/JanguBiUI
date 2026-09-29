'use client';

import { Suspense } from 'react';

import { JournalComptes } from '@/features/admin-comptes/components/journal';
import { PageComptes } from '@/features/admin-comptes/components/page-comptes';

export default function AdminComptesJournalPage() {
  return (
    <PageComptes title="Journal d’audit" subtitle="Actions sur les comptes">
      <Suspense>
        <JournalComptes />
      </Suspense>
    </PageComptes>
  );
}
