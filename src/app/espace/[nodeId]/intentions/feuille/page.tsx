import type { Metadata } from 'next';

import { PageHeader } from '@/components/ui/page-header';
import { FeuilleIntentions } from '@/features/intentions/components/feuille-intentions';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../../capability-denied';

export const metadata: Metadata = { title: 'Feuille des intentions' };

type Props = {
  params: Promise<{ nodeId: string }>;
  searchParams: Promise<{ date?: string }>;
};

/** Feuille des intentions d'un jour, à imprimer pour la sacristie. */
const FeuilleIntentionsPage = async ({ params, searchParams }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  const { date = '' } = await searchParams;
  return (
    <RequireCapability
      capacite="intentions.gerer"
      nodeId={nodeId}
      fallback={
        <CapabilityDenied
          nodeId={nodeId}
          what="Intentions de messe"
          capacite="intentions.gerer"
        />
      }
    >
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Feuille des intentions"
          description="À imprimer pour la sacristie."
          className="print:hidden"
        />
        <FeuilleIntentions node={nodeId} date={date} />
      </div>
    </RequireCapability>
  );
};

export default FeuilleIntentionsPage;
