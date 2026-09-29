'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import NextLink from 'next/link';

import { Icon, type IconName } from '@/components/ui/icon';
import { type BackofficeKind, backofficeKindOf } from '@/config/nav';
import { paths } from '@/config/paths';
import type { NodeContext } from '@/lib/can';

const KIND_LABEL: Record<BackofficeKind, string> = { paroisse: 'Paroisses', diocese: 'Diocèses et doyennés', plateforme: 'Plateforme' };
const KIND_ICON: Record<BackofficeKind, IconName> = { paroisse: 'paroisse', diocese: 'diocese', plateforme: 'globe' };
const ORDER: BackofficeKind[] = ['paroisse', 'diocese', 'plateforme'];

export const hrefOfContext = (context: NodeContext) =>
  context.nodeId ? paths.espace.root.getHref(context.nodeId) : paths.plateforme.root.getHref();

type Props = {
  kind: BackofficeKind;
  /** `name` : nom du nœud ; `space` : « Espace paroisse » ; `parent` : rattachement (infobulle). */
  current: { name: string; space: string; parent?: string };
  contexts: NodeContext[];
  currentId: string | null;
};

/**
 * Sélecteur de nœud en tête de la barre latérale (WEB-PAR-*, 232 × 56) : pastille 32 b100, nom
 * 15/600 et espace 13 ink3, chevron ; ouvre la liste des nœuds où l'on détient une capacité.
 */
export const NodeContextSwitcher = ({ kind, current, contexts, currentId }: Props) => {
  const groups = ORDER.map((k) => ({ kind: k, items: contexts.filter((c) => backofficeKindOf(c.type) === k) })).filter((g) => g.items.length);
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Changer de contexte : ${current.name}, ${current.space.toLowerCase()}`}
        className="flex min-h-14 w-full items-center gap-2.5 rounded-12 border border-line bg-paper px-3 py-2 text-left text-ink shadow-card transition-colors hover:border-line-active"
      >
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-8 bg-tint-100 text-primary-strong">
          <Icon name={KIND_ICON[kind]} size={18} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-[18px]">
          {/* Deux lignes, puis coupe avec infobulle (A11Y-18) : « Paroisse Saint-Dominique » reste lisible. */}
          <span title={current.parent ? `${current.name} · ${current.parent}` : current.name} className="line-clamp-2 break-words text-15 font-semibold leading-[18px]">
            {current.name}
          </span>
          <span className="text-13 leading-[18px] text-ink-3">{current.space}</span>
        </span>
        <Icon name="chevron-bas" size={18} className="shrink-0 text-ink-3" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 max-h-[60vh] w-[260px] overflow-y-auto rounded-12 border border-line bg-paper p-1.5 shadow-menu"
        >
          {groups.map((group) => (
            <DropdownMenu.Group key={group.kind}>
              <DropdownMenu.Label className="px-2.5 pb-1 pt-1.5 text-13 text-ink-3">{KIND_LABEL[group.kind]}</DropdownMenu.Label>
              {group.items.map((context) => (
                <DropdownMenu.Item key={context.nodeId ?? 'plateforme'} asChild>
                  <NextLink
                    href={hrefOfContext(context)}
                    aria-current={context.nodeId === currentId ? 'true' : undefined}
                    className="flex min-h-9 items-center justify-between gap-2 rounded-8 px-2.5 text-14 text-ink outline-none hover:text-ink data-[highlighted]:bg-surface-2"
                  >
                    {context.name}
                    {context.nodeId === currentId && <Icon name="check" size={16} className="text-primary" />}
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
