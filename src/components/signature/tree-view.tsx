'use client';

import * as React from 'react';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

export type TreeNode = { id: string; label: string; meta?: string; children?: TreeNode[] };

/** Arbre des juridictions navigable au clavier (DIO-Structure) : role="tree". */
export const TreeView = ({
  nodes,
  selectedId,
  onSelect,
  label,
  defaultExpanded = [],
}: {
  nodes: TreeNode[];
  selectedId?: string;
  onSelect: (id: string) => void;
  label: string;
  defaultExpanded?: string[];
}) => {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(defaultExpanded));
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const render = (items: TreeNode[], level: number): React.ReactNode =>
    items.map((node) => {
      const hasChildren = Boolean(node.children?.length);
      const open = expanded.has(node.id);
      return (
        <li key={node.id} role="treeitem" aria-level={level} aria-expanded={hasChildren ? open : undefined} aria-selected={node.id === selectedId}>
          <div className={cn('flex min-h-11 items-center gap-1 border-b border-line', node.id === selectedId && 'bg-tint-50')} style={{ paddingLeft: (level - 1) * 20 }}>
            {hasChildren ? (
              <button type="button" onClick={() => toggle(node.id)} aria-label={open ? `Replier ${node.label}` : `Déplier ${node.label}`} className="inline-flex size-8 items-center justify-center rounded text-ink-2 hover:bg-surface-2">
                <Icon name={open ? 'chevron-bas' : 'chevron-droite'} size={16} />
              </button>
            ) : (
              <span className="size-8" />
            )}
            <button type="button" onClick={() => onSelect(node.id)} className="flex flex-1 items-baseline justify-between gap-3 py-2 text-left text-base text-ink hover:text-primary">
              <span className={cn(node.id === selectedId && 'font-semibold')}>{node.label}</span>
              {node.meta && <span className="tnum text-meta text-ink-3">{node.meta}</span>}
            </button>
          </div>
          {hasChildren && open && (
            <ul role="group" className="m-0 list-none p-0">
              {render(node.children!, level + 1)}
            </ul>
          )}
        </li>
      );
    });
  return (
    <ul role="tree" aria-label={label} className="m-0 list-none p-0">
      {render(nodes, 1)}
    </ul>
  );
};
