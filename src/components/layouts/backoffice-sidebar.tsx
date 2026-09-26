'use client';

import { Brand } from '@/components/layouts/brand';
import { NavLink } from '@/components/layouts/nav-link';
import { hrefOfContext, NodeContextSwitcher } from '@/components/layouts/node-context-switcher';
import { SignOutButton } from '@/components/layouts/sign-out-button';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { BACKOFFICE_LABEL, type BackofficeKind, type BackofficeGroup, backofficeKindOf } from '@/config/nav';
import { displayName, useMe } from '@/hooks/use-me';
import { useOfficeLabel } from '@/hooks/use-office-types';
import { type NodeContext, officeTitle } from '@/lib/can';
import { cn } from '@/utils/cn';

const KIND_TAB: Record<BackofficeKind, string> = { paroisse: 'Paroisse', diocese: 'Diocèse', plateforme: 'Plateforme' };
const EYEBROW: Record<string, string> = {
  paroisse: 'Paroisse',
  quasi_paroisse: 'Quasi-paroisse',
  aumonerie: 'Aumônerie',
  diocese: 'Diocèse',
  province: 'Province',
  doyenne: 'Doyenné',
  zone: 'Zone pastorale',
  plateforme: 'Plateforme',
};

type Props = {
  kind: BackofficeKind;
  context: NodeContext;
  parentName?: string;
  contexts: NodeContext[];
  groups: BackofficeGroup[];
  homeHref: string;
};

/** Sidebar du back-office (272 px) : marque, contexte, onglets de niveau, navigation par capacités, identité. */
export const BackofficeSidebar = ({ kind, context, parentName, contexts, groups, homeHref }: Props) => {
  const { data: me } = useMe();
  const catalogueLabel = useOfficeLabel(context.offices[0]);
  const office = officeTitle(context, context.offices[0], catalogueLabel);
  const name = displayName(me);
  const kinds = (['paroisse', 'diocese', 'plateforme'] as const)
    .map((k) => ({ kind: k, first: contexts.find((c) => backofficeKindOf(c.type) === k) }))
    .filter((k) => k.first);
  return (
    <aside className="flex w-full flex-col border-r border-line-strong bg-surface px-4 pb-4 pt-6 lg:sticky lg:top-0 lg:h-dvh lg:w-68 lg:shrink-0 lg:overflow-y-auto">
      <Brand href={homeHref} label={`Jàngu Bi, ${BACKOFFICE_LABEL[kind].toLowerCase()}`} subtitle={BACKOFFICE_LABEL[kind]} stacked className="px-3" />
      <NodeContextSwitcher
        current={{ eyebrow: EYEBROW[context.type] ?? KIND_TAB[kind], name: context.name, parent: parentName }}
        contexts={contexts}
        currentId={context.nodeId}
      />
      {kinds.length > 1 && (
        <nav aria-label="Contextes disponibles" className="mt-3 grid grid-flow-col gap-1 border-b border-line text-xs">
          {kinds.map(({ kind: k, first }) => (
            <a
              key={k}
              href={hrefOfContext(first!)}
              aria-current={k === kind ? 'true' : undefined}
              className={cn('flex h-9 items-center justify-center border-b-2 border-transparent text-ink-2 hover:text-ink', k === kind && 'border-primary font-semibold text-primary')}
            >
              {KIND_TAB[k]}
            </a>
          ))}
        </nav>
      )}
      <nav aria-label={BACKOFFICE_LABEL[kind]} className="mt-2 flex flex-col">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="tnum m-0 px-3 pb-2 pt-4 text-meta text-ink-3">{group.title}</p>
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                match={item.match}
                className="flex h-10 items-center gap-3 rounded px-3 text-base text-ink-2 hover:bg-surface-2 hover:text-ink"
                activeClassName="bg-surface-2 font-semibold text-primary hover:text-primary"
              >
                {item.icon && <Icon name={item.icon} size={20} />}
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="mt-auto flex items-center gap-3 border-t border-line pt-4">
        <Avatar name={name.full || '?'} size={36} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-ink">{name.full}</span>
          {office && <span className="truncate text-meta text-ink-3">{office}</span>}
        </span>
        <SignOutButton iconOnly />
      </div>
    </aside>
  );
};
