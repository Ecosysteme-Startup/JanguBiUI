'use client';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { RoleGuard } from '@/components/layouts/role-guard';
import { SantePaiementsVue } from '@/features/dons-analyse/components/sante-paiements';
import { canViewPlatformPayments } from '@/lib/authorization';

export default function PlateformePaiementsPage() {
  useRegisterPageMeta({ title: 'Santé des paiements' });
  return (
    <RoleGuard allow={canViewPlatformPayments}>
      <ContentContainer width="wide">
        <SantePaiementsVue />
      </ContentContainer>
    </RoleGuard>
  );
}
