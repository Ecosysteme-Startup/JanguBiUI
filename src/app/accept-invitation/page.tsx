'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { SansRoute } from '@/components/staff/sans-route';
import { Spinner } from '@/components/ui/spinner';

import { AcceptInvitationContent } from './accept-invitation-content';

function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
          <p className="font-medium text-destructive">
            Lien d&apos;invitation invalide.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Vérifiez que vous avez utilisé le bon lien.
          </p>
        </div>
      </div>
    );
  }

  return <AcceptInvitationContent token={token} />;
}

function PageContenu() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <AcceptInvitationPage />
    </Suspense>
  );
}

export default function Page() {
  return (
    <SansRoute cle="invitationsClerge" titre="Invitation">
      <PageContenu />
    </SansRoute>
  );
}
