'use client';

import type { ReactNode } from 'react';

import { type Capacite, type Grant, useCapacites } from '@/lib/capacites';

/** `nodeId` absent : la capacité sur au moins un nœud suffit. `null` : hors arbre (plateforme). */
export const can = (grants: readonly Grant[], capacite: Capacite, nodeId?: string | null): boolean =>
  grants.some(
    (g) =>
      g.capacite === capacite &&
      (nodeId === undefined || g.node_id === nodeId || (g.node_id === null && g.node_type === 'plateforme')),
  );

export type NodeContext = { nodeId: string | null; name: string; type: string; offices: string[] };

/** Les contextes du sélecteur : un par nœud où l'utilisateur a au moins une capacité (spec §2.3). */
export const contextsOf = (grants: readonly Grant[]): NodeContext[] => {
  const byNode = new Map<string, NodeContext>();
  grants.forEach((g) => {
    const key = g.node_id ?? 'plateforme';
    const current = byNode.get(key) ?? { nodeId: g.node_id, name: g.node_name, type: g.node_type, offices: [] };
    byNode.set(key, current.offices.includes(g.office) ? current : { ...current, offices: [...current.offices, g.office] });
  });
  return [...byNode.values()];
};

/**
 * Autorisation d'AFFICHAGE : masque ce que l'utilisateur ne peut pas faire.
 * Le backend reste l'autorité sur chaque requête.
 */
export const useCan = (capacite: Capacite, nodeId?: string | null): boolean => {
  const { data } = useCapacites();
  return can(data ?? [], capacite, nodeId);
};

export const useNodes = (capacite: Capacite): NodeContext[] => {
  const { data } = useCapacites();
  return contextsOf((data ?? []).filter((g) => g.capacite === capacite));
};

export const useContexts = () => {
  const query = useCapacites();
  return { ...query, contexts: contextsOf(query.data ?? []) };
};

type RequireCapabilityProps = {
  capacite: Capacite | Capacite[];
  nodeId?: string | null;
  children: ReactNode;
  fallback?: ReactNode;
};

/** Rend `children` si l'une des capacités est détenue sur le nœud. */
export const RequireCapability = ({ capacite, nodeId, children, fallback = null }: RequireCapabilityProps) => {
  const { data, isPending } = useCapacites();
  if (isPending) return null;
  const wanted = Array.isArray(capacite) ? capacite : [capacite];
  return wanted.some((c) => can(data ?? [], c, nodeId)) ? <>{children}</> : <>{fallback}</>;
};
