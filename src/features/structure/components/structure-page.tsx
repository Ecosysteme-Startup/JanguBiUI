'use client';

import * as React from 'react';

import { ImportWizard } from '@/components/signature/import-wizard';
import { type TreeNode, TreeView } from '@/components/signature/tree-view';
import { Button } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { SectionHeading } from '@/components/ui/section-heading';
import { Select } from '@/components/ui/select';
import { LoadingBlock } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { useNodeTypes } from '@/hooks/use-node-types';
import { useCan } from '@/lib/can';

import { useNodesChildren } from '../api/get-node-children';
import { useNodeDetail } from '../api/get-node-detail';
import { type StructureImportKind, useImportStructure } from '../api/import-structure';
import type { StructureNode } from '../api/node-schema';
import { SEARCH_LIMIT, useSearchNodes } from '../api/search-nodes';

import { NodeFormModal } from './node-form-modal';
import { NodePanel } from './node-panel';

const Hint = ({ node }: { node: StructureNode }) =>
  node.status === 'en_fondation' ? (
    <span className="text-meta text-warn">En fondation</span>
  ) : node.is_active_on_platform ? (
    <span title="Active sur Jàngu Bi" className="inline-flex items-center gap-1.5 text-meta text-primary">
      <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
      <span className="sr-only">Active sur Jàngu Bi</span>
    </span>
  ) : null;

const toTree = (node: StructureNode, childrenOf: Map<string, StructureNode[] | undefined>): TreeNode => ({
  id: node.id,
  label: node.name,
  meta: node.type.label,
  hint: <Hint node={node} />,
  hasChildren: node.has_children,
  children: childrenOf.get(node.id)?.map((child) => toTree(child, childrenOf)),
});

const StructureImport = ({ onClose }: { onClose: () => void }) => {
  const [kind, setKind] = React.useState<StructureImportKind>('nodes');
  const importer = useImportStructure();
  const run = (dryRun: boolean) => (file: File) => importer.mutateAsync({ kind, file, dryRun });
  return (
    <ImportWizard
      key={kind}
      eyebrow="Assistant d’import · structure"
      title={kind === 'nodes' ? 'Importer des nœuds' : 'Importer des lieux de culte'}
      columns={
        kind === 'nodes'
          ? 'code, type, name, parent_code (puis status, city, address…)'
          : 'node_code, name, kind (puis is_main, city, address…)'
      }
      extra={
        <fieldset className="m-0 flex flex-wrap gap-6 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold text-ink">Contenu du fichier</legend>
          <Choice type="radio" name="import-kind" label="Nœuds" checked={kind === 'nodes'} onChange={() => setKind('nodes')} />
          <Choice type="radio" name="import-kind" label="Lieux de culte" checked={kind === 'places'} onChange={() => setKind('places')} />
        </fieldset>
      }
      simulate={run(true)}
      apply={run(false)}
      auditNote="Chaque nœud ou lieu créé est inscrit au journal d’audit."
      onClose={onClose}
    />
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
  const [q, setQ] = React.useState('');
  const [type, setType] = React.useState('');
  const [importing, setImporting] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const debouncedQ = useDebounce(q, 300);
  const filtering = Boolean(debouncedQ.trim() || type);
  const search = useSearchNodes(nodeId, debouncedQ.trim(), type);
  const childrenOf = useNodesChildren(opened);
  const selected = useNodeDetail(selectedId);

  if (root.isPending) return <LoadingBlock label="Chargement de la structure…" lines={6} />;
  if (root.isError) {
    return (
      <EmptyState tone="err" icon="alerte" title="La structure n’a pas pu être chargée">
        {root.error.message}
      </EmptyState>
    );
  }

  const tree = [toTree(root.data, childrenOf)];

  return (
    <div>
      <PageHeader
        number="02"
        eyebrow={`Gouvernance · ${root.data.type.label} ${root.data.code}`}
        title="Structure"
        actions={
          canEdit && (
            <>
              <Button variant="secondary" onClick={() => setImporting((v) => !v)} aria-expanded={importing}>
                Importer un CSV
              </Button>
              <Button onClick={() => setAdding(true)}>Ajouter un nœud</Button>
            </>
          )
        }
      />
      {importing && (
        <div className="mt-8">
          <StructureImport onClose={() => setImporting(false)} />
        </div>
      )}
      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section aria-labelledby="s-arbre" className="flex min-w-0 flex-col lg:col-span-6">
          <SectionHeading id="s-arbre" number="01" title="Arbre des juridictions" aside={root.data.name} />
          <div className="flex items-end gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <label htmlFor="s-rech" className="tnum text-meta text-ink-3">
                Filtrer l’arbre
              </label>
              <Input
                id="s-rech"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nom, code, ville"
                className="h-10 text-sm"
              />
            </div>
            <div className="flex w-44 flex-col gap-1.5">
              <label htmlFor="s-type" className="tnum text-meta text-ink-3">
                Type
              </label>
              <Select id="s-type" value={type} onChange={(e) => setType(e.target.value)} className="h-10 text-sm">
                <option value="">Tous les types</option>
                {(types.data ?? [])
                  .filter((t) => t.order > (types.data?.find((x) => x.code === root.data.type.code)?.order ?? 0))
                  .map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label}
                    </option>
                  ))}
              </Select>
            </div>
          </div>
          <div className="mt-4 border border-line bg-surface py-1">
            {filtering ? (
              search.isPending ? (
                <div className="p-4">
                  <LoadingBlock label="Recherche…" lines={3} />
                </div>
              ) : search.isError ? (
                <p className="m-0 p-4 text-sm text-err">La recherche a échoué. Réessayez.</p>
              ) : search.data.results.length === 0 ? (
                <p className="m-0 p-4 text-sm text-ink-2">Aucun nœud ne correspond à ce filtre.</p>
              ) : (
                <>
                  <p aria-live="polite" className="tnum m-0 px-3 py-2 text-meta text-ink-3">
                    {search.data.count} résultat{search.data.count > 1 ? 's' : ''}
                    {search.data.count > SEARCH_LIMIT && ` · ${SEARCH_LIMIT} premiers affichés`}
                  </p>
                  <ul aria-label="Résultats du filtre" className="m-0 list-none p-0">
                    {search.data.results.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          aria-pressed={n.id === selectedId}
                          onClick={() => setSelectedId(n.id)}
                          className="flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left text-sm text-ink hover:bg-surface-2 aria-pressed:bg-tint-50"
                        >
                          <span className="font-medium">{n.name}</span>
                          <span className="tnum text-meta text-ink-3">
                            {n.type.label} · {n.code}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )
            ) : (
              <TreeView
                label={`Juridictions : ${root.data.name}`}
                nodes={tree}
                selectedId={selectedId}
                onSelect={setSelectedId}
                defaultExpanded={[nodeId]}
                onExpand={(id) => setOpened((prev) => (prev.includes(id) ? prev : [...prev, id]))}
              />
            )}
          </div>
          <p className="tnum m-0 mt-2 flex items-center gap-4 text-meta text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
              Active sur Jàngu Bi
            </span>
            <span>Flèches du clavier pour parcourir, Entrée pour ouvrir la fiche</span>
          </p>
        </section>
        <div className="min-w-0 lg:col-span-6">
          <NodePanel nodeId={selectedId} onSelect={setSelectedId} canEdit={canEdit} canAppoint={canAppoint} />
        </div>
      </div>
      <NodeFormModal
        open={adding}
        onOpenChange={setAdding}
        parent={selected.data ?? root.data}
        onSaved={(created) => {
          setOpened((prev) => (created.parent_id && !prev.includes(created.parent_id) ? [...prev, created.parent_id] : prev));
          setSelectedId(created.id);
        }}
      />
    </div>
  );
};
