import type { Metadata } from 'next';

import { PageHeader } from '@/components/ui/page-header';
import { IntentionsParoisse } from '@/features/intentions/components/intentions-paroisse';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../capability-denied';

export const metadata: Metadata = { title: 'Intentions de messe' };

type Props = { params: Promise<{ nodeId: string }> };

/** Intentions reçues par la paroisse : planifier, refuser, célébrer ; plafond par messe. */
const IntentionsParoissePage = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
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
          title="Intentions de messe"
          description="Planifiez les intentions reçues sur les messes de la paroisse."
        />
        <IntentionsParoisse nodeId={nodeId} />
      </div>
    </RequireCapability>
  );
};

export default IntentionsParoissePage;
