import type { Metadata } from 'next';

import { AuthShell } from '@/components/layouts/auth-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { AccepterInvitation } from '@/features/clergy-accounts/components/accepter-invitation';

export const metadata: Metadata = {
  title: 'Invitation',
  robots: { index: false },
};

type Props = { searchParams: Promise<{ token?: string }> };

/** Acceptation d'une invitation du clergé (lien reçu par e-mail : `/accept-invitation?token=`). */
const AcceptInvitationPage = async ({ searchParams }: Props) => {
  const { token = '' } = await searchParams;
  return (
    <AuthShell>
      {token ? (
        <AccepterInvitation token={token} />
      ) : (
        <EmptyState
          icon="erreur"
          tone="err"
          title="Lien d’invitation invalide."
        >
          Vérifiez que vous avez utilisé le bon lien.
        </EmptyState>
      )}
    </AuthShell>
  );
};

export default AcceptInvitationPage;
