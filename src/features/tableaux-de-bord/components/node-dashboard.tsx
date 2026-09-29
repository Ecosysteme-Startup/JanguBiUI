'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/skeleton';
import { backofficeKindOf } from '@/config/nav';
import { useNode } from '@/hooks/use-node';
import { useContexts } from '@/lib/can';

import { DioceseDashboard } from './diocese-dashboard';
import { ParishDashboard } from './parish-dashboard';

/**
 * Tableau de bord du nœud courant : PAR-* pour une paroisse, DIO-* pour un diocèse,
 * un doyenné ou une province (choix par le type du nœud).
 */
export const NodeDashboardView = ({ nodeId }: { nodeId: string }) => {
  const { contexts, isPending } = useContexts();
  const direct = contexts.find((c) => c.nodeId === nodeId);
  // La plateforme peut ouvrir n'importe quel nœud : son type vient alors de l'arbre.
  const node = useNode(!isPending && !direct ? nodeId : null);
  const type = direct?.type ?? node.data?.type.code;

  if (isPending || node.isLoading) return <LoadingBlock label="Chargement du tableau de bord…" lines={6} />;
  if (!type) {
    return (
      <EmptyState tone="err" icon="alerte" title="Ce nœud est introuvable">
        Vérifiez le lien ou choisissez un autre contexte.
      </EmptyState>
    );
  }
  return backofficeKindOf(type) === 'paroisse' ? (
    <ParishDashboard nodeId={nodeId} offices={direct?.offices ?? []} officeLabels={direct?.officeLabels} />
  ) : (
    <DioceseDashboard nodeId={nodeId} />
  );
};
