import type { Metadata } from 'next';

import { PageHeader } from '@/components/ui/page-header';
import { AnalyseDons } from '@/features/dons-analyse/components/analyse-dons';
import { RequireCapability } from '@/lib/can';

import { CapabilityDenied } from '../../capability-denied';

export const metadata: Metadata = { title: 'Analyse des dons' };

type Props = { params: Promise<{ nodeId: string }> };

/** Analyse des dons : la paroisse (dons.voir_fonds) ou les agrégats du diocèse (dons.voir_agregats). */
const AnalyseDonsPage = async ({ params }: Props) => {
  const nodeId = decodeURIComponent((await params).nodeId);
  return (
    <RequireCapability
      capacite={['dons.voir_fonds', 'dons.voir_agregats']}
      nodeId={nodeId}
      fallback={
        <CapabilityDenied
          nodeId={nodeId}
          what="Analyse des dons"
          capacite="dons.voir_fonds"
        />
      }
    >
      <div className="flex flex-col gap-6">
        <PageHeader
          compact
          title="Dons et quêtes"
          description="Analyse : ce qui a été reçu, par fonds et par période."
        />
        <AnalyseDons nodeId={nodeId} />
      </div>
    </RequireCapability>
  );
};

export default AnalyseDonsPage;
