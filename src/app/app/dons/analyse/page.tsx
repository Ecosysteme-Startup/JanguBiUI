'use client';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { RoleGuard } from '@/components/layouts/role-guard';
import { AnalyseParoisseVue } from '@/features/dons-analyse/components/analyse-paroisse';
import { canViewParishDonsAnalysis } from '@/lib/authorization';

export default function DonsAnalysePage() {
  useRegisterPageMeta({ title: 'Dons et quêtes', leafLabel: 'Analyse' });
  return (
    <RoleGuard allow={canViewParishDonsAnalysis}>
      <ContentContainer width="wide">
        <AnalyseParoisseVue />
      </ContentContainer>
    </RoleGuard>
  );
}
