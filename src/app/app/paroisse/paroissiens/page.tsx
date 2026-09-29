'use client';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { RoleGuard } from '@/components/layouts/role-guard';
import { ParoissiensStaff } from '@/features/paroissiens/components/paroissiens-staff';
import { canManageParishioners } from '@/lib/authorization';

export default function ParoissiensPage() {
  useRegisterPageMeta({ title: 'Paroissiens', showHeading: false });
  return (
    <RoleGuard allow={canManageParishioners}>
      <ContentContainer width="wide">
        <ParoissiensStaff />
      </ContentContainer>
    </RoleGuard>
  );
}
