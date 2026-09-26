'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';
import { type BackofficeKind, backofficeKindOf } from '@/config/nav';
import { paths } from '@/config/paths';
import type { NodeContext } from '@/lib/can';

const KIND_LABEL: Record<BackofficeKind, string> = { paroisse: 'Paroisses', diocese: 'Diocèses et doyennés', plateforme: 'Plateforme' };
const ORDER: BackofficeKind[] = ['paroisse', 'diocese', 'plateforme'];

export const hrefOfContext = (context: NodeContext) =>
  context.nodeId ? paths.espace.root.getHref(context.nodeId) : paths.plateforme.root.getHref();

type Props = { current: { eyebrow: string; name: string; parent?: string }; contexts: NodeContext[]; currentId: string | null };

/** Sélecteur de contexte (PAR/DIO/PLA-Tableau-de-bord) : nœuds où l'on détient une capacité, groupés par niveau. */
export const NodeContextSwitcher = ({ current, contexts, currentId }: Props) => {
  const groups = ORDER.map((kind) => ({ kind, items: contexts.filter((c) => backofficeKindOf(c.type) === kind) })).filter((g) => g.items.length);
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Changer de contexte : ${current.name}`}
        className="mt-6 flex w-full items-center justify-between gap-2 rounded border border-line-field bg-paper p-3 text-left text-ink hover:border-ink"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="tnum text-meta text-ink-3">{current.eyebrow}</span>
          {/* Deux lignes, puis coupe avec infobulle (A11Y-18) : « Paroisse Saint-Dominique » reste lisible. */}
          <span title={current.name} className="line-clamp-2 break-words font-serif text-[21px] leading-[1.1]">
            {current.name}
          </span>
          {current.parent && (
            <span title={current.parent} className="line-clamp-2 break-words text-xs text-ink-2">
              {current.parent}
            </span>
          )}
        </span>
        <Icon name="chevron-bas" size={18} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 max-h-[60vh] w-[260px] overflow-y-auto rounded border border-line-strong bg-paper p-2 shadow-modal"
        >
          {groups.map((group) => (
            <DropdownMenu.Group key={group.kind}>
              <DropdownMenu.Label className="tnum px-2 pb-1 pt-2 text-meta text-ink-3">{KIND_LABEL[group.kind]}</DropdownMenu.Label>
              {group.items.map((context) => (
                <DropdownMenu.Item key={context.nodeId ?? 'plateforme'} asChild>
                  <NextLink
                    href={hrefOfContext(context)}
                    aria-current={context.nodeId === currentId ? 'true' : undefined}
                    className="flex min-h-11 items-center justify-between gap-2 rounded px-2 text-sm text-ink outline-none data-[highlighted]:bg-surface-2"
                  >
                    {context.name}
                    {context.nodeId === currentId && <Icon name="check" size={16} />}
                  </NextLink>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Group>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
