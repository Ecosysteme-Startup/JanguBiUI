'use client';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { RoleGuard } from '@/components/layouts/role-guard';
import { AnalyseDioceseVue } from '@/features/dons-analyse/components/analyse-diocese';
import { canViewDioceseDonsAggregates } from '@/lib/authorization';

export default function DioceseDonsPage() {
  useRegisterPageMeta({ title: "Dons dans l'archidiocèse" });
  return (
    <RoleGuard allow={canViewDioceseDonsAggregates}>
      <ContentContainer width="wide">
        <AnalyseDioceseVue />
      </ContentContainer>
    </RoleGuard>
  );
}
