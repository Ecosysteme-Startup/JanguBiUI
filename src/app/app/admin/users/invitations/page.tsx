'use client';

import Link from 'next/link';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { SansRoute } from '@/components/staff/sans-route';
import { Button } from '@/components/ui/button/button';
import { paths } from '@/config/paths';
import { useInvitations } from '@/features/clergy-accounts/api/get-invitations';
import { InvitationList } from '@/features/clergy-accounts/components/invitation-list';
import { canManageClergy } from '@/lib/authorization';

function InvitationsPageContenu() {
  const { data, isLoading } = useInvitations();

  return (
    <AdminPageLayout
      title="Invitations clergé"
      subtitle="Gérez les invitations envoyées aux membres du clergé"
      allow={canManageClergy}
      headerAction={
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={paths.app.admin.users.validation.getHref()}>
              Validations en attente
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={paths.app.admin.users.invite.getHref()}>
              + Nouvelle invitation
            </Link>
          </Button>
        </div>
      }
    >
      <InvitationList
        invitations={data?.results ?? []}
        isLoading={isLoading}
      />
    </AdminPageLayout>
  );
}

export default function InvitationsPage() {
  return (
    <SansRoute cle="invitationsClerge" titre="Invitations du clergé">
      <InvitationsPageContenu />
    </SansRoute>
  );
}
