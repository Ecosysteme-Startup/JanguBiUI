'use client';

import * as React from 'react';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

export type TreeNode = {
  id: string;
  label: string;
  /** Légende à droite (type de nœud, « 11 par. »). */
  meta?: string;
  /** Indication visuelle avant la légende (pastille « active », « en fondation »). */
  hint?: React.ReactNode;
  children?: TreeNode[];
  /** Enfants connus mais pas encore chargés (chargement à l'ouverture). */
  hasChildren?: boolean;
};

type Visible = { node: TreeNode; level: number; parentId: string | null };

const flatten = (nodes: TreeNode[], expanded: Set<string>, level = 1, parentId: string | null = null): Visible[] =>
  nodes.flatMap((node) => [
    { node, level, parentId },
    ...(expanded.has(node.id) && node.children ? flatten(node.children, expanded, level + 1, node.id) : []),
  ]);

const expandable = (node: TreeNode) => Boolean(node.children?.length) || Boolean(node.hasChildren);

/**
 * Arbre des juridictions (DIO-Structure), motif « tree » de l'ARIA APG :
 * un seul élément dans l'ordre de tabulation, flèches haut/bas pour parcourir,
 * droite/gauche pour ouvrir/fermer, Début/Fin, Entrée ou Espace pour sélectionner.
 */
export const TreeView = ({
  nodes,
  selectedId,
  onSelect,
  label,
  defaultExpanded = [],
  onExpand,
}: {
  nodes: TreeNode[];
  selectedId?: string;
  onSelect: (id: string) => void;
  label: string;
  defaultExpanded?: string[];
  /** Appelé à l'ouverture d'un nœud (chargement paresseux des enfants). */
  onExpand?: (id: string) => void;
}) => {
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set(defaultExpanded));
  const [focusedId, setFocusedId] = React.useState<string | undefined>(undefined);
  const refs = React.useRef(new Map<string, HTMLLIElement>());

  const visible = flatten(nodes, expanded);
  const tabbableId =
    (focusedId && visible.some((v) => v.node.id === focusedId) && focusedId) ||
    (selectedId && visible.some((v) => v.node.id === selectedId) && selectedId) ||
    visible[0]?.node.id;

  const setOpen = (node: TreeNode, open: boolean) => {
    if (open && !expanded.has(node.id)) onExpand?.(node.id);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (open) next.add(node.id);
      else next.delete(node.id);
      return next;
    });
  };

  const focus = (id: string | undefined) => {
    if (!id) return;
    setFocusedId(id);
    refs.current.get(id)?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const index = visible.findIndex((v) => v.node.id === tabbableId);
    const current = visible[index];
    if (!current) return;
    const { node } = current;
    const handled = () => {
      event.preventDefault();
      event.stopPropagation();
    };
    switch (event.key) {
      case 'ArrowDown':
        handled();
        focus(visible[index + 1]?.node.id);
        break;
      case 'ArrowUp':
        handled();
        focus(visible[index - 1]?.node.id);
        break;
      case 'Home':
        handled();
        focus(visible[0]?.node.id);
        break;
      case 'End':
        handled();
        focus(visible.at(-1)?.node.id);
        break;
      case 'ArrowRight':
        handled();
        if (!expandable(node)) break;
        if (!expanded.has(node.id)) setOpen(node, true);
        else focus(visible[index + 1]?.level === current.level + 1 ? visible[index + 1].node.id : undefined);
        break;
      case 'ArrowLeft':
        handled();
        if (expandable(node) && expanded.has(node.id)) setOpen(node, false);
        else focus(current.parentId ?? undefined);
        break;
      case 'Enter':
      case ' ':
        handled();
        onSelect(node.id);
        break;
      default:
    }
  };

  const render = (items: TreeNode[], level: number): React.ReactNode =>
    items.map((node) => {
      const canOpen = expandable(node);
      const open = expanded.has(node.id);
      const selected = node.id === selectedId;
      return (
        <li
          key={node.id}
          ref={(el) => {
            if (el) refs.current.set(node.id, el);
            else refs.current.delete(node.id);
          }}
          role="treeitem"
          aria-level={level}
          aria-expanded={canOpen ? open : undefined}
          aria-selected={selected}
          aria-label={node.meta ? `${node.label}, ${node.meta}` : node.label}
          tabIndex={node.id === tabbableId ? 0 : -1}
          onFocus={(event) => {
            if (event.target === event.currentTarget) setFocusedId(node.id);
          }}
          className="outline-none focus-visible:[&>div]:outline focus-visible:[&>div]:outline-2 focus-visible:[&>div]:-outline-offset-2 focus-visible:[&>div]:outline-primary"
        >
          {/* Le clic reste possible à la souris ; le clavier passe par l'arbre (onKeyDown). */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            onClick={() => {
              setFocusedId(node.id);
              onSelect(node.id);
            }}
            className={cn(
              'flex min-h-9 cursor-pointer items-center gap-2 pr-3 hover:bg-surface-2',
              selected && 'bg-tint-50 hover:bg-tint-50',
            )}
            style={{ paddingLeft: 4 + (level - 1) * 16 }}
          >
            {canOpen ? (
              <button
                type="button"
                tabIndex={-1}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpen(node, !open);
                }}
                aria-label={open ? `Replier ${node.label}` : `Déplier ${node.label}`}
                className="inline-flex size-6 shrink-0 items-center justify-center rounded text-ink hover:bg-surface-2"
              >
                <Icon name={open ? 'chevron-bas' : 'chevron-droite'} size={16} />
              </button>
            ) : (
              <span aria-hidden="true" className="size-6 shrink-0" />
            )}
            {/* Retour à la ligne plutôt que troncature muette (A11Y-18) ; infobulle pour la souris. */}
            <span
              title={node.label}
              className={cn(
                'min-w-0 flex-1 break-words py-1 text-sm text-ink',
                (level <= 2 || selected) && 'font-medium',
                selected && 'font-semibold',
              )}
            >
              {node.label}
            </span>
            {node.hint}
            {node.meta && <span className="tnum w-24 shrink-0 text-right text-meta text-ink-3">{node.meta}</span>}
          </div>
          {canOpen && open && node.children && (
            <ul role="group" className="m-0 list-none p-0">
              {render(node.children, level + 1)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <ul role="tree" aria-label={label} onKeyDown={onKeyDown} className="m-0 list-none p-0">
      {render(nodes, 1)}
    </ul>
  );
};
