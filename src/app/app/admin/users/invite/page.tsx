'use client';

import { useRouter } from 'next/navigation';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { SansRoute } from '@/components/staff/sans-route';
import { paths } from '@/config/paths';
import { InvitationForm } from '@/features/clergy-accounts/components/invitation-form';
import { canManageClergy } from '@/lib/authorization';

function InvitePageContenu() {
  const router = useRouter();

  return (
    <AdminPageLayout
      title="Inviter du clergé"
      subtitle="Un email d'invitation sera envoyé. Le lien est valable 48h."
      allow={canManageClergy}
      width="md"
    >
      <InvitationForm
        onSuccess={() =>
          router.push(paths.app.admin.users.invitations.getHref())
        }
      />
    </AdminPageLayout>
  );
}

export default function InvitePage() {
  return (
    <SansRoute cle="invitationsClerge" titre="Inviter du clergé">
      <InvitePageContenu />
    </SansRoute>
  );
}
