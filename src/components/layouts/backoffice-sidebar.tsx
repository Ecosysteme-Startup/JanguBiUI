'use client';

import NextLink from 'next/link';
import { Fragment } from 'react';

import { Brand } from '@/components/layouts/brand';
import { NodeContextSwitcher } from '@/components/layouts/node-context-switcher';
import { SidebarFrame, SidebarLink, SidebarSeparator } from '@/components/layouts/sidebar-nav';
import { preferFideleSpace } from '@/components/layouts/staff-home-redirect';
import { UserMenu } from '@/components/layouts/user-menu';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { BACKOFFICE_LABEL, type BackofficeGroup, type BackofficeKind, backofficeKindOf } from '@/config/nav';
import { paths } from '@/config/paths';
import { displayName, useMe } from '@/hooks/use-me';
import { useOfficeLabel } from '@/hooks/use-office-types';
import { hrefOfContextForUser, type NodeContext, officeTitle } from '@/lib/can';
import { useCapacites } from '@/lib/capacites';
import { cn } from '@/utils/cn';

const KIND_TAB: Record<BackofficeKind, string> = { paroisse: 'Paroisse', diocese: 'Diocèse', plateforme: 'Plateforme' };

type Props = {
  kind: BackofficeKind;
  context: NodeContext;
  parentName?: string;
  contexts: NodeContext[];
  groups: BackofficeGroup[];
  homeHref: string;
};

/**
 * Barre latérale du back-office (WEB-PAR-*, WEB-DIO-*, WEB-PLA-*) : logotype, sélecteur de nœud, rubriques
 * filtrées par capacités (groupes séparés d'un filet), pied avec l'identité, l'office, le menu du
 * compte et le retour à l'espace fidèle. Colonne de 264 px à partir de lg, tiroir « Menu » en dessous.
 */
export const BackofficeSidebar = ({ kind, context, parentName, contexts, groups, homeHref }: Props) => {
  const { data: me } = useMe();
  const { data: grants = [] } = useCapacites();
  const catalogueLabel = useOfficeLabel(context.offices[0]);
  const office = officeTitle(context, context.offices[0], catalogueLabel);
  const name = displayName(me);
  const kinds = (['paroisse', 'diocese', 'plateforme'] as const)
    .map((k) => ({ kind: k, first: contexts.find((c) => backofficeKindOf(c.type) === k) }))
    .filter((k) => k.first);
  return (
    <SidebarFrame>
      <Brand href={homeHref} label={`Jàngu Bi, accueil de l’espace ${KIND_TAB[kind].toLowerCase()}`} size="sm" className="mb-4 h-10 self-start px-2" />
      <NodeContextSwitcher
        kind={kind}
        current={{ name: context.name, space: BACKOFFICE_LABEL[kind], parent: parentName }}
        contexts={contexts}
        currentId={context.nodeId}
      />
      {kinds.length > 1 && (
        <nav aria-label="Contextes disponibles" className="mt-3 flex gap-0.5 rounded-10 bg-surface-2 p-[3px]">
          {kinds.map(({ kind: k, first }) => (
            <a
              key={k}
              href={hrefOfContextForUser(grants, first!)}
              aria-current={k === kind ? 'true' : undefined}
              className={cn(
                'flex h-8 flex-1 items-center justify-center rounded-8 text-13',
                k === kind ? 'bg-paper font-semibold text-ink shadow-card hover:text-ink' : 'font-medium text-ink-2 hover:text-ink',
              )}
            >
              {KIND_TAB[k]}
            </a>
          ))}
        </nav>
      )}
      <nav aria-label={BACKOFFICE_LABEL[kind]} className="mt-5 flex flex-col gap-0.5">
        {groups.map((group, index) => (
          <Fragment key={group.title}>
            {index > 0 && <SidebarSeparator />}
            {group.items.map((item) => (
              <SidebarLink key={item.href} href={item.href} label={item.label} icon={item.icon} match={item.match} />
            ))}
          </Fragment>
        ))}
      </nav>
      <div className="min-h-6 flex-1" />
      <div className="flex flex-col gap-3 border-t border-line pt-4">
        <div className="flex items-center gap-2.5 px-1">
          <Avatar name={name.full || '?'} size={36} />
          <span className="flex min-w-0 flex-1 flex-col leading-[18px]">
            <span className="truncate text-14 font-semibold leading-[18px] text-ink">{name.full}</span>
            {office && <span className="truncate text-13 leading-[18px] text-ink-3">{office}</span>}
          </span>
          <UserMenu />
        </div>
        <NextLink
          href={paths.app.root.getHref()}
          onClick={preferFideleSpace}
          className="flex min-h-9 items-center gap-2 rounded-10 px-3 text-14 text-ink-2 hover:bg-surface-2 hover:text-ink"
        >
          <Icon name="fleche-gauche" size={18} className="text-ink-3" />
          Revenir à mon espace fidèle
        </NextLink>
      </div>
    </SidebarFrame>
  );
};
