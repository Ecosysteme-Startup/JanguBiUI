'use client';

import * as React from 'react';

import { ImportWizard } from '@/components/signature/import-wizard';
import { type TreeNode, TreeView } from '@/components/signature/tree-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Choice } from '@/components/ui/choice';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { LoadingBlock } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { useNodeTypes } from '@/hooks/use-node-types';
import { useCan } from '@/lib/can';

import { useNodesChildren } from '../api/get-node-children';
import { useNodeDetail } from '../api/get-node-detail';
import {
  type StructureImportKind,
  useImportStructure,
} from '../api/import-structure';
import type { StructureNode } from '../api/node-schema';
import { SEARCH_LIMIT, useSearchNodes } from '../api/search-nodes';
import { scopeOf } from '../utils/scope';

import { NodeFormModal } from './node-form-modal';
import { NodePanel } from './node-panel';

const Hint = ({ node }: { node: StructureNode }) =>
  node.status === 'en_fondation' ? (
    <span className="whitespace-nowrap text-12 font-semibold text-warn">
      En fondation
    </span>
  ) : node.is_active_on_platform ? (
    <span title="Active sur Jàngu Bi" className="inline-flex items-center">
      <span aria-hidden="true" className="size-2 rounded-full bg-ok-dot" />
      <span className="sr-only">Active sur Jàngu Bi</span>
    </span>
  ) : null;

/** Icône de type de nœud dans l'arbre (WEB-DIO-Structure). */
const TYPE_ICON: Record<string, IconName> = {
  province: 'carte',
  diocese: 'diocese',
  doyenne: 'couches',
  paroisse: 'paroisse',
  quasi_paroisse: 'paroisse',
  ceb: 'utilisateurs',
};

const toTree = (
  node: StructureNode,
  childrenOf: Map<string, StructureNode[] | undefined>,
): TreeNode => ({
  id: node.id,
  label: node.name,
  icon: TYPE_ICON[node.type.code] ?? 'structure',
  hint: <Hint node={node} />,
  hasChildren: node.has_children,
  children: childrenOf.get(node.id)?.map((child) => toTree(child, childrenOf)),
});

const StructureImport = ({ onClose }: { onClose: () => void }) => {
  const [kind, setKind] = React.useState<StructureImportKind>('nodes');
  const importer = useImportStructure();
  const run = (dryRun: boolean) => (file: File) =>
    importer.mutateAsync({ kind, file, dryRun });
  return (
    <ImportWizard
      key={kind}
      eyebrow="Assistant d’import · structure"
      title={
        kind === 'nodes' ? 'Importer des nœuds' : 'Importer des lieux de culte'
      }
      columns={
        kind === 'nodes'
          ? 'code, type, name, parent_code (puis status, city, address…)'
          : 'node_code, name, kind (puis is_main, city, address…)'
      }
      extra={
        <fieldset className="m-0 flex flex-wrap gap-6 border-0 p-0">
          <legend className="mb-2 text-14 font-semibold text-ink">
            Contenu du fichier
          </legend>
          <Choice
            type="radio"
            name="import-kind"
            label="Nœuds"
            checked={kind === 'nodes'}
            onChange={() => setKind('nodes')}
          />
          <Choice
            type="radio"
            name="import-kind"
            label="Lieux de culte"
            checked={kind === 'places'}
            onChange={() => setKind('places')}
          />
        </fieldset>
      }
      simulate={run(true)}
      apply={run(false)}
      auditNote="Chaque nœud ou lieu créé est inscrit au journal d’audit."
      onClose={onClose}
    />
  );
};

type SearchProps = {
  nodeId: string;
  q: string;
  type: string;
  selectedId: string;
  onSelect: (id: string) => void;
};

const SearchResults = ({
  nodeId,
  q,
  type,
  selectedId,
  onSelect,
}: SearchProps) => {
  const search = useSearchNodes(nodeId, q, type);
  if (search.isPending) {
    return (
      <div className="p-2">
        <LoadingBlock label="Recherche…" lines={3} />
      </div>
    );
  }
  if (search.isError)
    return (
      <p className="m-0 p-2 text-14 text-err">
        La recherche a échoué. Réessayez.
      </p>
    );
  if (search.data.results.length === 0)
    return (
      <p className="m-0 p-2 text-14 text-ink-2">
        Aucun nœud ne correspond à ce filtre.
      </p>
    );
  return (
    <>
      <p aria-live="polite" className="tnum m-0 px-2 pb-1 text-13 text-ink-3">
        {search.data.count} résultat{search.data.count > 1 ? 's' : ''}
        {search.data.count > SEARCH_LIMIT &&
          ` · ${SEARCH_LIMIT} premiers affichés`}
      </p>
      <ul
        aria-label="Résultats du filtre"
        className="m-0 flex list-none flex-col gap-px p-0"
      >
        {search.data.results.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              aria-pressed={n.id === selectedId}
              onClick={() => onSelect(n.id)}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-8 px-2 text-left text-14 text-ink hover:bg-surface aria-pressed:bg-tint-50 aria-pressed:font-semibold aria-pressed:text-tint-800"
            >
              <span className="min-w-0 break-words">{n.name}</span>
              <span className="tnum shrink-0 text-13 font-normal text-ink-3">
                {n.type.label} · {n.code}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
};

/** Arbre des juridictions et fiche du nœud sélectionné (DIO-Structure). */
export const StructurePage = ({ nodeId }: { nodeId: string }) => {
  const root = useNodeDetail(nodeId);
  const types = useNodeTypes();
  const canEdit = useCan('structure.gerer', nodeId);
  const canAppoint = useCan('offices.nommer', nodeId);
  const [selectedId, setSelectedId] = React.useState(nodeId);
  const [opened, setOpened] = React.useState<string[]>([nodeId]);
  // Remonter l'arbre (clé) le replie entièrement : l'état d'ouverture vit dans <TreeView>.
  const [treeKey, setTreeKey] = React.useState(0);
  const [q, setQ] = React.useState('');
  const [type, setType] = React.useState('');
  const [importing, setImporting] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const debouncedQ = useDebounce(q, 300);
  const filtering = Boolean(debouncedQ.trim() || type);
  const childrenOf = useNodesChildren(opened);
  const selected = useNodeDetail(selectedId);

  if (root.isPending)
    return <LoadingBlock label="Chargement de la structure…" lines={6} />;
  if (root.isError) {
    return (
      <EmptyState
        tone="err"
        icon="alerte"
        title="La structure n’a pas pu être chargée"
      >
        {root.error.message}
      </EmptyState>
    );
  }

  const tree = [toTree(root.data, childrenOf)];
  const rootOrder =
    types.data?.find((x) => x.code === root.data.type.code)?.order ?? 0;

  return (
    <div>
      <PageHeader
        compact
        title="Structure"
        description={`Les juridictions de ${scopeOf(root.data)}, du doyenné à la communauté ecclésiale de base.`}
        actions={
          canEdit && (
            <>
              <Button
                variant="outline"
                className="min-h-11 text-14"
                onClick={() => setImporting((v) => !v)}
                aria-expanded={importing}
              >
                <Icon name="import" size={18} className="text-ink-2" />
                Importer un CSV
              </Button>
              <Button className="min-h-11 px-5" onClick={() => setAdding(true)}>
                <Icon name="plus" size={18} />
                Ajouter un nœud
              </Button>
            </>
          )
        }
      />
      {importing && (
        <div className="mt-8">
          <StructureImport onClose={() => setImporting(false)} />
        </div>
      )}
      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,372px)_minmax(0,1fr)]">
        <Card
          as="section"
          padding="none"
          aria-label="Arbre des juridictions"
          className="min-w-0 overflow-hidden"
        >
          <div className="px-4 pb-3 pt-4">
            <label htmlFor="s-rech" className="sr-only">
              Filtrer l’arbre
            </label>
            <Input
              id="s-rech"
              type="search"
              icon="recherche"
              controlSize="sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Paroisse, doyenné ou CEB"
              className="h-10 rounded-10 text-14"
            />
            <div className="mt-3 flex items-center justify-between gap-3 text-13 text-ink-3">
              <label htmlFor="s-type" className="sr-only">
                Type de nœud
              </label>
              <Select
                id="s-type"
                controlSize="sm"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-8 w-auto min-w-0 max-w-full rounded-8 pr-8 text-13"
              >
                <option value="">Tous les types</option>
                {(types.data ?? [])
                  .filter((t) => t.order > rootOrder)
                  .map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label}
                    </option>
                  ))}
              </Select>
              {!filtering && (
                <button
                  type="button"
                  onClick={() => {
                    setTreeKey((k) => k + 1);
                    setSelectedId(nodeId);
                  }}
                  className="hit shrink-0 whitespace-nowrap rounded-6 font-semibold text-primary hover:text-primary-strong hover:underline"
                >
                  Tout replier
                </button>
              )}
            </div>
          </div>
          <div className="border-t border-line px-2 pb-3 pt-2">
            {filtering ? (
              <SearchResults
                nodeId={nodeId}
                q={debouncedQ.trim()}
                type={type}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ) : (
              <TreeView
                key={treeKey}
                label={`Juridictions : ${root.data.name}`}
                nodes={tree}
                selectedId={selectedId}
                onSelect={setSelectedId}
                defaultExpanded={[nodeId]}
                onExpand={(id) =>
                  setOpened((prev) =>
                    prev.includes(id) ? prev : [...prev, id],
                  )
                }
              />
            )}
          </div>
          <div className="flex flex-col gap-1 border-t border-line bg-surface px-4 py-3 text-13 text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-ok-dot"
              />
              Active sur Jàngu Bi
            </span>
            <span>
              Flèches du clavier pour parcourir, Entrée pour ouvrir la fiche.
            </span>
          </div>
        </Card>
        <div className="min-w-0">
          <NodePanel
            nodeId={selectedId}
            onSelect={setSelectedId}
            canEdit={canEdit}
            canAppoint={canAppoint}
          />
        </div>
      </div>
      <NodeFormModal
        open={adding}
        onOpenChange={setAdding}
        parent={selected.data ?? root.data}
        onSaved={(created) => {
          setOpened((prev) =>
            created.parent_id && !prev.includes(created.parent_id)
              ? [...prev, created.parent_id]
              : prev,
          );
          setSelectedId(created.id);
        }}
      />
    </div>
  );
};
