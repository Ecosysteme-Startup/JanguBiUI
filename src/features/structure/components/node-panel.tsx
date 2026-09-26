'use client';

import NextLink from 'next/link';
import * as React from 'react';

import { StatusDot } from '@/components/signature/status-dot';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { paths } from '@/config/paths';
import { dayjs } from '@/utils/dates';

import { useNodeDetail } from '../api/get-node-detail';
import { useNodeHolders } from '../api/get-node-holders';
import { NODE_STATUS_LABEL, type StructureNode } from '../api/node-schema';
import { type Place, PLACE_KINDS, usePlaces } from '../api/places';

import { NodeFormModal } from './node-form-modal';
import { PlaceFormModal } from './place-form-modal';

const SubHeading = ({ letter, title, count, aside }: { letter: string; title: string; count?: number; aside?: React.ReactNode }) => (
  <div className="tnum mb-3 mt-8 flex items-baseline justify-between gap-4 border-t border-line pt-2 text-meta text-ink-2">
    <h3 className="m-0 text-meta font-normal">
      <span className="text-primary">{letter}</span> — {title}
      {count !== undefined && <span className="ml-2 text-ink-3">{count}</span>}
    </h3>
    {aside}
  </div>
);

const Places = ({ node, canEdit }: { node: StructureNode; canEdit: boolean }) => {
  const places = usePlaces(node.id);
  const [editing, setEditing] = React.useState<Place | 'new' | null>(null);
  return (
    <>
      <SubHeading
        letter="A"
        title="Lieux de culte"
        count={places.data?.length}
        aside={
          canEdit && (
            <Button variant="tertiary" size="sm" className="h-auto min-h-0" onClick={() => setEditing('new')}>
              Ajouter un lieu
            </Button>
          )
        }
      />
      {places.isPending ? (
        <LoadingBlock label="Chargement des lieux de culte…" lines={2} />
      ) : places.isError ? (
        <p className="m-0 text-sm text-err">Les lieux de culte n’ont pas pu être chargés.</p>
      ) : places.data.length === 0 ? (
        <p className="m-0 text-sm text-ink-2">Aucun lieu de culte déclaré.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {places.data.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5">
              <div className="min-w-0">
                <p className="m-0 text-base font-medium text-ink">{p.name}</p>
                <p className="m-0 text-sm text-ink-2">
                  {[p.is_main ? 'Lieu principal' : p.kind ? PLACE_KINDS[p.kind] : null, p.address].filter(Boolean).join(' · ')}
                </p>
              </div>
              {canEdit && <IconButton icon="crayon" label={`Modifier ${p.name}`} size="sm" onClick={() => setEditing(p)} />}
            </li>
          ))}
        </ul>
      )}
      <PlaceFormModal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        nodeId={node.id}
        nodeName={node.name}
        place={editing && editing !== 'new' ? editing : undefined}
      />
    </>
  );
};

const Holders = ({ node }: { node: StructureNode }) => {
  const holders = useNodeHolders(node.id, true);
  return (
    <>
      <SubHeading
        letter="B"
        title="Titulaires d’offices"
        aside={
          <NextLink href={paths.espace.nominations.getHref(node.id)} className="text-primary">
            Nominations du nœud
          </NextLink>
        }
      />
      {holders.isPending ? (
        <LoadingBlock label="Chargement des titulaires…" lines={2} />
      ) : holders.isError ? (
        <p className="m-0 text-sm text-err">Les titulaires n’ont pas pu être chargés.</p>
      ) : holders.data.length === 0 ? (
        <p className="m-0 text-sm text-ink-2">Aucun office pourvu sur ce nœud.</p>
      ) : (
        <Table label="Titulaires d’offices, défilement horizontal">
          <thead>
            <tr>
              <Th>Office</Th>
              <Th>Titulaire</Th>
              <Th>Depuis</Th>
            </tr>
          </thead>
          <tbody>
            {holders.data.map((h) => (
              <Tr key={h.id}>
                <Td>{h.office_label}</Td>
                <Td>
                  <span className="flex items-center gap-2">
                    <Avatar name={h.person.full_name} size={28} />
                    {h.person.full_name}
                  </span>
                </Td>
                <Td className="tnum">
                  {h.status === 'proposee' ? (
                    <StatusDot tone="outline" label={`Proposée au ${dayjs(h.start_date).format('DD.MM')}`} />
                  ) : h.end_date ? (
                    `Fin le ${dayjs(h.end_date).format('DD.MM')}`
                  ) : (
                    dayjs(h.start_date).format('DD.MM.YYYY')
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
};

type NodePanelProps = {
  nodeId: string;
  onSelect: (id: string) => void;
  /** Capacités du contexte courant, héritées sur tout son sous-arbre. */
  canEdit: boolean;
  canAppoint: boolean;
};

/** Panneau du nœud sélectionné (DIO-Structure, colonne de droite). */
export const NodePanel = ({ nodeId, onSelect, canEdit, canAppoint }: NodePanelProps) => {
  const detail = useNodeDetail(nodeId);
  const parent = useNodeDetail(detail.data?.parent_id);
  const [modal, setModal] = React.useState<'edit' | 'child' | null>(null);

  if (detail.isPending) return <LoadingBlock label="Chargement du nœud…" lines={5} />;
  if (detail.isError) {
    return (
      <EmptyState tone="err" icon="alerte" title="Ce nœud n’a pas pu être chargé">
        {detail.error.message}
      </EmptyState>
    );
  }
  const node = detail.data;
  return (
    <section aria-labelledby="s-noeud" className="border border-line bg-surface p-6">
      <p className="tnum m-0 text-meta text-ink-3">Nœud sélectionné · {node.code}</p>
      {/* flex-wrap : sous 1024 px et dans la colonne de 6/12, les actions passent sous le titre (A11Y-08). */}
      <div className="mt-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <h2 id="s-noeud" className="m-0 min-w-0 break-words font-serif text-h3 font-normal text-ink">
          {node.name}
        </h2>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <IconButton icon="crayon" label="Modifier le nœud" bordered onClick={() => setModal('edit')} />
            <Button variant="secondary" size="sm" onClick={() => setModal('child')}>
              Ajouter un enfant
            </Button>
          </div>
        )}
      </div>
      {(node.city || node.address) && <p className="m-0 mt-1 text-sm text-ink-2">{[node.address, node.city].filter(Boolean).join(', ')}</p>}
      <dl className="m-0 mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 [&>div]:min-w-0">
        <div>
          <dt className="tnum text-meta text-ink-3">Type</dt>
          <dd className="m-0 mt-1 text-sm text-ink">{node.type.label}</dd>
        </div>
        <div>
          <dt className="tnum text-meta text-ink-3">Parent</dt>
          <dd className="m-0 mt-1 text-sm">
            {parent.data ? (
              <Button variant="tertiary" size="sm" className="h-auto min-h-0 whitespace-normal break-words text-left text-sm" onClick={() => onSelect(parent.data.id)}>
                {parent.data.name}
              </Button>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div>
          <dt className="tnum text-meta text-ink-3">Statut</dt>
          <dd className="m-0 mt-1 text-sm text-ink">{NODE_STATUS_LABEL[node.status ?? 'erige']}</dd>
        </div>
        <div>
          <dt className="tnum text-meta text-ink-3">Jàngu Bi</dt>
          <dd className="m-0 mt-1 text-sm">
            {node.is_active_on_platform ? <StatusDot tone="primary" label="Active" /> : <StatusDot tone="outline" label="Non raccordée" />}
          </dd>
        </div>
      </dl>
      <Places node={node} canEdit={canEdit} />
      {canAppoint && <Holders node={node} />}
      <NodeFormModal open={modal === 'edit'} onOpenChange={(open) => !open && setModal(null)} node={node} />
      <NodeFormModal
        open={modal === 'child'}
        onOpenChange={(open) => !open && setModal(null)}
        parent={node}
        onSaved={(created) => onSelect(created.id)}
      />
    </section>
  );
};
