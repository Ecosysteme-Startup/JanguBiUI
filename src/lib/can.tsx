'use client';

import type { ReactNode } from 'react';

import { backofficeKindOf, firstAllowedBackofficeHref } from '@/config/nav';
import { paths } from '@/config/paths';
import { type Capacite, type Grant, useCapacites } from '@/lib/capacites';

/** `nodeId` absent : la capacité sur au moins un nœud suffit. `null` : hors arbre (plateforme). */
export const can = (grants: readonly Grant[], capacite: Capacite, nodeId?: string | null): boolean =>
  grants.some(
    (g) =>
      g.capacite === capacite &&
      (nodeId === undefined || g.node_id === nodeId || (g.node_id === null && g.node_type === 'plateforme')),
  );

/**
 * `offices` : codes des offices exercés sur le nœud ; `officeLabels` : titre réel de chaque
 * nomination (« Curé » ou « Administrateur paroissial », jamais la double forme du catalogue).
 */
export type NodeContext = {
  nodeId: string | null;
  name: string;
  type: string;
  offices: string[];
  officeLabels?: Record<string, string>;
};

/** Les contextes du sélecteur : un par nœud où l'utilisateur a au moins une capacité (spec §2.3). */
export const contextsOf = (grants: readonly Grant[]): NodeContext[] => {
  const byNode = new Map<string, NodeContext>();
  grants.forEach((g) => {
    const key = g.node_id ?? 'plateforme';
    const current = byNode.get(key) ?? { nodeId: g.node_id, name: g.node_name, type: g.node_type, offices: [], officeLabels: {} };
    byNode.set(
      key,
      current.offices.includes(g.office)
        ? current
        : {
            ...current,
            offices: [...current.offices, g.office],
            officeLabels: g.office_label ? { ...current.officeLabels, [g.office]: g.office_label } : current.officeLabels,
          },
    );
  });
  return [...byNode.values()];
};

/** Titre de la personne pour un office du contexte ; à défaut, `fallback` (libellé du catalogue). */
export const officeTitle = (context: Pick<NodeContext, 'officeLabels'>, office: string | undefined, fallback = ''): string =>
  (office && context.officeLabels?.[office]) || fallback;

/**
 * Lien d'entrée dans l'espace d'un contexte, calculé selon les capacités : la première rubrique
 * ouverte (et non le tableau de bord, refusé à un vicaire). À défaut, la racine du contexte.
 */
export const hrefOfContextForUser = (grants: readonly Grant[], context: NodeContext): string => {
  const kind = backofficeKindOf(context.type);
  const nodeId = context.nodeId ?? '';
  const allowed = firstAllowedBackofficeHref(kind, nodeId, (c) => can(grants, c, context.nodeId));
  return allowed ?? (context.nodeId ? paths.espace.root.getHref(context.nodeId) : paths.plateforme.root.getHref());
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
