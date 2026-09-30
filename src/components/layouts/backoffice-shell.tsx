'use client';

import NextLink from 'next/link';
import type { ReactNode } from 'react';

import { AppFrame, TopbarText } from '@/components/layouts/app-frame';
import { BackofficeSidebar } from '@/components/layouts/backoffice-sidebar';
import { isMfaRequired, MfaRequiredNotice } from '@/components/layouts/mfa-required-notice';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/skeleton';
import { backofficeKindOf, backofficeNav } from '@/config/nav';
import { paths } from '@/config/paths';
import { useNode } from '@/hooks/use-node';
import { useNodeParentName } from '@/hooks/use-node-ancestors';
import { can, useContexts } from '@/lib/can';

/**
 * Shell du back-office pour un nœud (`nodeId`) ou pour la plateforme (`nodeId = null`).
 * La navigation est calculée depuis `/me/capacites/` ; le backend reste l'autorité.
 * Barre supérieure par défaut : « Nœud · Rattachement » (WEB-PAR-*, WEB-DIO-*) ; les écrans de
 * détail y posent leur fil d'Ariane par <TopbarContent>.
 */
export const BackofficeShell = ({ nodeId, children }: { nodeId: string | null; children: ReactNode }) => {
  const { data: grants = [], contexts, isPending, isError, error } = useContexts();
  const direct = contexts.find((c) => c.nodeId === nodeId);
  // La plateforme exerce ses capacités sur tout l'arbre : elle peut ouvrir n'importe quel nœud.
  const platform = contexts.find((c) => c.nodeId === null);
  const node = useNode(!direct && platform && nodeId ? nodeId : null);
  const context =
    direct ??
    (platform && node.data ? { nodeId, name: node.data.name, type: node.data.type.code, offices: platform.offices, officeLabels: platform.officeLabels } : undefined);
  const parentName = useNodeParentName(context ? nodeId : null);

  if (isPending || node.isLoading) {
    return (
      <div className="mx-auto max-w-xl p-10">
        <LoadingBlock label="Chargement de votre espace…" />
      </div>
    );
  }
  if (isError && isMfaRequired(error)) {
    return (
      <div className="mx-auto max-w-xl p-10">
        <MfaRequiredNotice />
      </div>
    );
  }
  if (isError || !context) {
    return (
      <div className="mx-auto max-w-xl p-10">
        <EmptyState icon="cadenas" title="Cet espace ne vous est pas ouvert">
          Aucune de vos nominations ne donne accès à ce contexte.{' '}
          <NextLink href={paths.app.root.getHref()}>Revenir à mon espace</NextLink>
        </EmptyState>
      </div>
    );
  }

  const kind = backofficeKindOf(context.type);
  const homeHref = nodeId ? paths.espace.root.getHref(nodeId) : paths.plateforme.root.getHref();
  const groups = backofficeNav(kind, nodeId ?? '')
    .map((g) => ({ ...g, items: g.items.filter((i) => i.capacites.some((c) => can(grants, c, nodeId))) }))
    .filter((g) => g.items.length > 0);

  const sidebar = (
    <BackofficeSidebar kind={kind} context={context} parentName={parentName} contexts={contexts} groups={groups} homeHref={homeHref} />
  );

  return (
    <AppFrame sidebar={sidebar} homeHref={homeHref} topbarFallback={<TopbarText>{[context.name, parentName].filter(Boolean).join(' · ')}</TopbarText>}>
      {children}
    </AppFrame>
  );
};
