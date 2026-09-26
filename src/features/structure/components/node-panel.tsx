'use client';

import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import * as React from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { nodeAncestorsQueryOptions } from '@/hooks/use-node-ancestors';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { useNodesChildren } from '../api/get-node-children';
import { useNodeDetail } from '../api/get-node-detail';
import { useNodeHolders } from '../api/get-node-holders';
import { NODE_STATUS_LABEL, type StructureNode } from '../api/node-schema';
import { type Place, PLACE_KINDS, usePlaces } from '../api/places';

import { NodeFormModal } from './node-form-modal';
import { PlaceFormModal } from './place-form-modal';

/** Sous-nœuds affichés avant « Voir les N sous-nœuds ». */
const CHILDREN_PREVIEW = 5;

const Block = ({ title, aside, children, last }: { title: string; aside?: React.ReactNode; children: React.ReactNode; last?: boolean }) => (
  <div className={cn('border-t border-line px-6 pt-5', last ? 'pb-6' : 'pb-5')}>
    <div className="flex items-baseline justify-between gap-4">
      <h3 className="m-0 text-18 font-semibold text-ink">{title}</h3>
      {aside}
    </div>
    <div className="mt-3">{children}</div>
  </div>
);

const Framed = ({ children, label }: { children: React.ReactNode; label?: string }) => (
  <ul aria-label={label} className="m-0 list-none overflow-hidden rounded-12 border border-line p-0">
    {children}
  </ul>
);

const Places = ({ node, canEdit }: { node: StructureNode; canEdit: boolean }) => {
  const places = usePlaces(node.id);
  const [editing, setEditing] = React.useState<Place | 'new' | null>(null);
  return (
    <Block
      title="Lieux de culte"
      aside={
        canEdit && (
          <button type="button" className="hit rounded-6 text-14 font-semibold text-primary hover:text-primary-strong hover:underline" onClick={() => setEditing('new')}>
            Ajouter un lieu
          </button>
        )
      }
    >
      {places.isPending ? (
        <LoadingBlock label="Chargement des lieux de culte…" lines={2} />
      ) : places.isError ? (
        <p className="m-0 text-14 text-err">Les lieux de culte n’ont pas pu être chargés.</p>
      ) : places.data.length === 0 ? (
        <p className="m-0 text-14 text-ink-2">Aucun lieu de culte déclaré.</p>
      ) : (
        <Framed label="Lieux de culte">
          {places.data.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 first:border-t-0 hover:bg-surface">
              <div className="min-w-0">
                <p className="m-0 text-15 font-semibold text-ink">{p.name}</p>
                <p className="m-0 text-13 text-ink-3">
                  {[p.is_main ? 'Lieu principal' : p.kind ? PLACE_KINDS[p.kind] : null, p.address].filter(Boolean).join(' · ')}
                </p>
              </div>
              {canEdit && <IconButton icon="crayon" label={`Modifier ${p.name}`} size="sm" onClick={() => setEditing(p)} />}
            </li>
          ))}
        </Framed>
      )}
      <PlaceFormModal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        nodeId={node.id}
        nodeName={node.name}
        place={editing && editing !== 'new' ? editing : undefined}
      />
    </Block>
  );
};

/** « 1er oct. 2024 » avec l'ordinal en exposant. */
const Day = ({ iso }: { iso: string }) => {
  const d = dayjs(iso);
  return d.date() === 1 ? (
    <>
      1<sup className="text-11 leading-none">er</sup>&nbsp;{d.format('MMM YYYY')}
    </>
  ) : (
    <>{d.format('D MMM YYYY')}</>
  );
};

const holderDates = (start: string, end: string | null | undefined) =>
  end ? (
    <>
      <Day iso={start} /> – <Day iso={end} />
    </>
  ) : (
    <>
      Depuis le <Day iso={start} />
    </>
  );

const Holders = ({ node }: { node: StructureNode }) => {
  const holders = useNodeHolders(node.id, true);
  return (
    <Block
      title="Offices sur ce nœud"
      aside={
        <NextLink href={paths.espace.nominations.getHref(node.id)} className="text-14 font-semibold">
          Nommer
        </NextLink>
      }
    >
      {holders.isPending ? (
        <LoadingBlock label="Chargement des titulaires…" lines={2} />
      ) : holders.isError ? (
        <p className="m-0 text-14 text-err">Les titulaires n’ont pas pu être chargés.</p>
      ) : holders.data.length === 0 ? (
        <p className="m-0 text-14 text-ink-2">Aucun office pourvu sur ce nœud.</p>
      ) : (
        <Framed label="Titulaires d’offices">
          {holders.data.map((h) => (
            <li key={h.id} className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0 hover:bg-surface">
              <Avatar name={h.person.full_name} size={36} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="break-words text-15 font-semibold text-ink">{h.person.full_name}</span>
                <span className="text-13 text-ink-3">{h.office_label}</span>
                <span className="tnum text-13 text-ink-2 sm:hidden">{holderDates(h.start_date, h.end_date)}</span>
              </span>
              <span className="tnum hidden w-48 shrink-0 text-14 text-ink-2 sm:block">{holderDates(h.start_date, h.end_date)}</span>
              <span className="w-24 shrink-0 text-right">
                {h.status === 'proposee' ? (
                  <Badge tone="info" dot>
                    Proposée
                  </Badge>
                ) : (
                  <Badge tone="ok" dot>
                    En vigueur
                  </Badge>
                )}
              </span>
            </li>
          ))}
        </Framed>
      )}
      <p className="m-0 mt-3 flex gap-2 text-13 text-ink-3">
        <Icon name="info" size={16} className="mt-px shrink-0" />
        Un office donne ses capacités sur ce nœud et sur tout son sous-arbre.
      </p>
    </Block>
  );
};

const PlatformBadge = ({ node }: { node: StructureNode }) =>
  node.is_active_on_platform ? (
    <Badge tone="ok" dot>
      Active
    </Badge>
  ) : (
    <span className="text-14 text-ink-3">Pas encore</span>
  );

const Children = ({ node, onSelect }: { node: StructureNode; onSelect: (id: string) => void }) => {
  const childrenOf = useNodesChildren(node.has_children ? [node.id] : []);
  const [all, setAll] = React.useState(false);
  if (!node.has_children) return null;
  const children = childrenOf.get(node.id);
  const shown = all ? children : children?.slice(0, CHILDREN_PREVIEW);
  return (
    <Block title="Sous-nœuds" aside={children && <span className="tnum text-13 text-ink-3">{shown?.length} sur {children.length}</span>} last>
      {!children ? (
        <LoadingBlock label="Chargement des sous-nœuds…" lines={3} />
      ) : (
        <div className="overflow-hidden rounded-12 border border-line">
          <div aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_132px] gap-3 bg-surface px-4 py-2 text-13 text-ink-3 sm:grid-cols-[minmax(0,1fr)_124px_132px]">
            <span>Nom</span>
            <span className="hidden sm:block">Type</span>
            <span>Jàngu Bi</span>
          </div>
          <ul aria-label={`Sous-nœuds de ${node.name}`} className="m-0 list-none p-0">
            {shown?.map((child) => (
              <li key={child.id} className="border-t border-line">
                <button
                  type="button"
                  onClick={() => onSelect(child.id)}
                  className="grid min-h-11 w-full grid-cols-[minmax(0,1fr)_132px] items-center gap-3 px-4 py-2.5 text-left text-14 hover:bg-surface sm:grid-cols-[minmax(0,1fr)_124px_132px]"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="break-words text-15 font-semibold text-ink">{child.name}</span>
                    <span className="text-13 text-ink-3 sm:hidden">{child.type.label}</span>
                  </span>
                  <span className="hidden text-ink-2 sm:block">{child.type.label}</span>
                  <span>
                    <PlatformBadge node={child} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {children.length > CHILDREN_PREVIEW && (
            <button
              type="button"
              onClick={() => setAll((v) => !v)}
              aria-expanded={all}
              className="flex h-11 w-full items-center justify-center border-t border-line text-14 font-semibold text-primary hover:bg-surface hover:text-primary-strong"
            >
              {all ? 'Afficher moins' : `Voir les ${children.length} sous-nœuds`}
            </button>
          )}
        </div>
      )}
    </Block>
  );
};

const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="min-w-0">
    <dt className="text-13 text-ink-3">{label}</dt>
    <dd className="m-0 mt-0.5 break-words text-15 font-medium text-ink">{children}</dd>
  </div>
);

type NodePanelProps = {
  nodeId: string;
  onSelect: (id: string) => void;
  /** Capacités du contexte courant, héritées sur tout son sous-arbre. */
  canEdit: boolean;
  canAppoint: boolean;
};

/** Fiche du nœud sélectionné (DIO-Structure, colonne de droite). */
export const NodePanel = ({ nodeId, onSelect, canEdit, canAppoint }: NodePanelProps) => {
  const detail = useNodeDetail(nodeId);
  const parent = useNodeDetail(detail.data?.parent_id);
  const ancestors = useQuery({ ...nodeAncestorsQueryOptions(nodeId), enabled: Boolean(detail.data?.parent_id) });
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
  const place = [node.address, node.city].filter(Boolean).join(', ');
  return (
    <Card as="section" padding="none" aria-labelledby="s-noeud" className="overflow-hidden">
      <div className="px-6 pb-5 pt-6">
        {ancestors.data && ancestors.data.length > 0 && (
          <nav aria-label="Chemin">
            <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-13 text-ink-3">
              {ancestors.data.map((a, i) => (
                <li key={a.id} className="inline-flex items-center gap-1.5">
                  {i > 0 && <Icon name="chevron-droite" size={14} />}
                  <button type="button" onClick={() => onSelect(a.id)} className="rounded-6 text-ink-3 hover:text-primary-strong hover:underline">
                    {a.name}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}
        {/* flex-wrap : en colonne étroite, les actions passent sous le titre (A11Y-08). */}
        <div className="mt-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h2 id="s-noeud" className="m-0 min-w-0 break-words text-24 font-semibold text-ink">
                {node.name}
              </h2>
              <Badge>{node.type.label}</Badge>
            </div>
            {place && <p className="m-0 mt-1 text-15 text-ink-2">{place}</p>}
          </div>
          {canEdit && (
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" className="text-14" onClick={() => setModal('edit')}>
                <Icon name="crayon" size={18} className="text-ink-2" />
                Modifier
              </Button>
              <IconButton icon="plus" label="Ajouter un enfant" bordered onClick={() => setModal('child')} />
            </div>
          )}
        </div>
        <dl className="m-0 mt-5 grid grid-cols-2 gap-x-6 gap-y-4 rounded-12 bg-surface p-4 sm:grid-cols-3">
          <Fact label="Rattaché à">
            {parent.data ? (
              <button type="button" onClick={() => onSelect(parent.data.id)} className="text-left font-medium text-primary hover:text-primary-strong hover:underline">
                {parent.data.name}
              </button>
            ) : (
              '—'
            )}
          </Fact>
          <Fact label="Code">
            <span className="tnum">{node.code}</span>
          </Fact>
          <Fact label="Érigé le">{node.erected_at ? dayjs(node.erected_at).format('D MMMM YYYY') : '—'}</Fact>
          <Fact label="Sur Jàngu Bi">{node.is_active_on_platform ? 'Active' : 'Pas encore ouverte'}</Fact>
          <Fact label="Statut canonique">{NODE_STATUS_LABEL[node.status ?? 'erige']}</Fact>
          <Fact label="Type">{node.type.label}</Fact>
        </dl>
      </div>
      {canAppoint && <Holders node={node} />}
      <Places node={node} canEdit={canEdit} />
      <Children node={node} onSelect={onSelect} />
      <NodeFormModal open={modal === 'edit'} onOpenChange={(open) => !open && setModal(null)} node={node} />
      <NodeFormModal
        open={modal === 'child'}
        onOpenChange={(open) => !open && setModal(null)}
        parent={node}
        onSaved={(created) => onSelect(created.id)}
      />
    </Card>
  );
};
