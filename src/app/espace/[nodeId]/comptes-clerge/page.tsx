import type { Metadata } from 'next';

import { PageHeader } from '@/components/ui/page-header';
import { ComptesClerge } from '@/features/clergy-accounts/components/comptes-clerge';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../capability-denied';

export const metadata: Metadata = { title: 'Comptes du clergé' };

type Props = { params: Promise<{ nodeId: string }> };

/** Comptes du clergé : invitations, validation et activation (capacité `comptes.valider`). */
const ComptesClergePage = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <RequireCapability
      capacite="comptes.valider"
      nodeId={nodeId}
      fallback={
        <CapabilityDenied
          nodeId={nodeId}
          what="Comptes du clergé"
          capacite="comptes.valider"
        />
      }
    >
      <div className="flex flex-col gap-6">
        <PageHeader
          compact
          title="Comptes du clergé"
          description="Invitez, validez et activez les comptes des prêtres, diacres et consacrés."
        />
        <ComptesClerge />
      </div>
    </RequireCapability>
  );
};

export default ComptesClergePage;
