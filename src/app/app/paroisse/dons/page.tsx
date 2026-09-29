'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { DonsParoisse } from '@/features/dons-staff/components/dons-paroisse';
import { peut } from '@/lib/staff/capacites';

function Contenu() {
  const vue = useSearchParams().get('vue') ?? undefined;
  return <DonsParoisse vue={vue} />;
}

export default function Page() {
  return (
    <AdminPageLayout
      title="Dons et quêtes"
      subtitle="Fonds, quêtes en espèces, opérations et export"
      allow={peut(
        'dons.voir_fonds',
        'dons.gerer_fonds',
        'dons.saisir_quete',
        'dons.exporter',
      )}
    >
      <Suspense>
        <Contenu />
      </Suspense>
    </AdminPageLayout>
  );
}
