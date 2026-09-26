'use client';

import NextLink from 'next/link';
import type { ReactNode } from 'react';

import { BackofficeDrawer } from '@/components/layouts/backoffice-drawer';
import { BackofficeSidebar } from '@/components/layouts/backoffice-sidebar';
import { BackofficeTopbar } from '@/components/layouts/backoffice-topbar';
import { LiturgyBannerSlot } from '@/components/layouts/liturgy-banner-slot';
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
    <div className="flex min-h-dvh flex-col bg-paper lg:flex-row">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-paper focus:p-3">
        Aller au contenu
      </a>
      {/* À l'impression (feuille d'annonces…), seul le contenu de la page sort.
          Sous lg, la sidebar passe dans le tiroir « Menu » de la barre du haut : le contenu d'abord (A11Y-06). */}
      <div className="contents print:hidden">
        <aside className="hidden border-r border-line-strong bg-surface px-4 pb-4 pt-6 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-68 lg:shrink-0 lg:flex-col lg:overflow-y-auto">
          {sidebar}
        </aside>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="contents print:hidden">
          <BackofficeTopbar
            rootLabel={context.name}
            rootHref={homeHref}
            groups={groups}
            menu={<BackofficeDrawer>{sidebar}</BackofficeDrawer>}
          />
          <LiturgyBannerSlot href={paths.app.parole.getHref()} variant="backoffice" className="px-4 lg:px-8" />
        </div>
        <main id="contenu" className="min-w-0 flex-1 px-4 py-8 lg:px-12 print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
};
