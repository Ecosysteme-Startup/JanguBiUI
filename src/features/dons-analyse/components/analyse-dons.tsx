'use client';

import { LoadingBlock } from '@/components/ui/skeleton';
import { useContexts } from '@/lib/can';

import { AnalyseDioceseVue } from './analyse-diocese';
import { AnalyseParoisseVue } from './analyse-paroisse';

/** Analyse du nœud de l'espace : vue paroisse, ou agrégats au-dessus de la paroisse. */
export function AnalyseDons({ nodeId }: { nodeId: string }) {
  const { contexts, isPending } = useContexts();
  if (isPending) return <LoadingBlock />;
  const type = contexts.find((c) => c.nodeId === nodeId)?.type;
  const paroisse = type === 'paroisse' || type === 'quasi_paroisse';
  return paroisse ? (
    <AnalyseParoisseVue nodeId={nodeId} />
  ) : (
    <AnalyseDioceseVue nodeId={nodeId} />
  );
}
