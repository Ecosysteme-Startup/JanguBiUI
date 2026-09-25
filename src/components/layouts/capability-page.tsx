'use client';

import type { ReactNode } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { RequireCapability } from '@/lib/can';
import type { Capacite } from '@/lib/capacites';

/**
 * Garde d'écran du back-office : le contenu n'est rendu que si l'une des capacités
 * est détenue sur le nœud (`undefined` : sur au moins un nœud). Le backend reste l'autorité.
 */
export const CapabilityPage = ({
  capacite,
  nodeId,
  children,
}: {
  capacite: Capacite | Capacite[];
  nodeId?: string | null;
  children: ReactNode;
}) => (
  <RequireCapability
    capacite={capacite}
    nodeId={nodeId}
    fallback={
      <EmptyState icon="cadenas" title="Cette page ne vous est pas ouverte">
        Aucune de vos nominations ne donne la capacité requise dans ce contexte.
      </EmptyState>
    }
  >
    {children}
  </RequireCapability>
);
