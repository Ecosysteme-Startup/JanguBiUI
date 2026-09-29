'use client';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { RoleGuard } from '@/components/layouts/role-guard';
import { SonothequeStaff } from '@/features/sonotheque/components/staff/sonotheque-staff';
import { canPublishAudio } from '@/lib/authorization';

export default function SonothequeStaffPage() {
  useRegisterPageMeta({ title: 'Sonothèque', showHeading: false });
  return (
    <RoleGuard allow={canPublishAudio}>
      <ContentContainer width="wide">
        <SonothequeStaff />
      </ContentContainer>
    </RoleGuard>
  );
}
