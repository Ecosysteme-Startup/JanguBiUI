'use client';

import { Suspense } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { RoleGuard } from '@/components/layouts/role-guard';
import { AjouterEnregistrements } from '@/features/sonotheque/components/staff/ajouter-enregistrements';
import { canPublishAudio } from '@/lib/authorization';

export default function AjouterEnregistrementsPage() {
  useRegisterPageMeta({
    title: 'Ajouter des enregistrements',
    showHeading: false,
  });
  return (
    <RoleGuard allow={canPublishAudio}>
      <ContentContainer width="wide">
        <Suspense>
          <AjouterEnregistrements />
        </Suspense>
      </ContentContainer>
    </RoleGuard>
  );
}
