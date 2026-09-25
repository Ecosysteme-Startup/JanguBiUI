import NextLink from 'next/link';

import { EmptyState } from '@/components/ui/empty-state';
import { paths } from '@/config/paths';

/** Repli des pages du back-office quand la capacité exigée manque sur ce nœud. */
export const CapabilityDenied = ({ nodeId, what, capacite }: { nodeId: string; what: string; capacite: string }) => (
  <EmptyState icon="cadenas" title={`${what} : accès réservé`}>
    Aucune de vos nominations sur ce nœud ne donne la capacité « {capacite} ». Demandez-la au curé ou à la chancellerie si vous en avez
    besoin.{' '}
    <NextLink href={paths.espace.root.getHref(nodeId)}>Revenir au tableau de bord</NextLink>
  </EmptyState>
);
