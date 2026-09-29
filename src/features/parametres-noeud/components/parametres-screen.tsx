'use client';

import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import type * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { PLACE_KIND_LABELS, useBackofficePlaces } from '@/hooks/use-backoffice-places';
import { nodeAncestorsQueryOptions } from '@/hooks/use-node-ancestors';
import { useCan } from '@/lib/can';
import { apiErrorMessage, isForbidden } from '@/utils/api-errors';
import { dayjs } from '@/utils/dates';

import { useNodeChildren } from '../api/node-children';
import { NODE_STATUS_LABELS, type NodeSettings, useNodeSettings, useParishLife } from '../api/node-settings';
import { useTypeDelays } from '../api/type-delays';

import { ParishLifeForm } from './parish-life-form';
import { SettingsCard } from './section-title';

const Row = ({ term, children }: { term: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 border-b border-line py-2.5 last:border-b-0">
    <dt className="text-14 text-ink-3">{term}</dt>
    <dd className="m-0 text-14 text-ink">{children}</dd>
  </div>
);

const Identity = ({ node, attachment }: { node: NodeSettings; attachment: string | undefined }) => (
  <SettingsCard id="p-id" title="Identité" description="Gérée par la chancellerie du diocèse : signalez-lui toute erreur." aside={<Badge tone="neutral" icon="cadenas">Lecture seule</Badge>}>
    <dl className="m-0 -my-2.5">
      <Row term="Nom">
        <span className="font-medium">{node.name}</span>
      </Row>
      <Row term="Nature">{node.type.label}</Row>
      <Row term="Code">
        <span className="tnum">{node.code}</span>
      </Row>
      <Row term="Statut">
        {NODE_STATUS_LABELS[node.status] ?? node.status}
        {node.erected_at && `, le ${dayjs(node.erected_at).format('DD.MM.YYYY')}`}
      </Row>
      {attachment && <Row term="Rattachement">{attachment}</Row>}
      <Row term="Jàngu Bi">{node.is_active_on_platform ? 'Active sur la plateforme' : 'En préparation'}</Row>
    </dl>
  </SettingsCard>
);

const PlacesAndChildren = ({ nodeId, isParish }: { nodeId: string; isParish: boolean }) => {
  const places = useBackofficePlaces(nodeId);
  const children = useNodeChildren(nodeId);
  return (
    <>
      <SettingsCard
        id="p-lieux"
        title="Lieux de culte"
        description="Un nouveau lieu est créé par la chancellerie, sur demande du curé."
        aside={<NextLink href={paths.espace.horaires.getHref(nodeId)}>Horaires</NextLink>}
      >
        {places.data && places.data.length > 0 ? (
          <ul className="m-0 -my-3 list-none p-0">
            {places.data.map((p) => (
              <li key={p.id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
                <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-10 bg-tint-50 text-primary-strong">
                  <Icon name="paroisse" size={18} />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-15 font-medium text-ink">{p.name}</span>
                  <span className="text-13 text-ink-3">
                    {PLACE_KIND_LABELS[p.kind] ?? p.kind}
                    {p.address && ` · ${p.address}`}
                    {!p.is_active && ' · inactif'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-14 text-ink-3">{places.isPending ? 'Chargement…' : 'Aucun lieu de culte enregistré.'}</p>
        )}
      </SettingsCard>

      <SettingsCard
        id="p-ceb"
        title={isParish ? 'CEB rattachées' : 'Nœuds rattachés'}
        description={children.data ? `${children.data.length} rattaché${children.data.length > 1 ? 's' : ''}` : undefined}
        aside={<NextLink href={paths.espace.equipe.getHref(nodeId)}>Nommer les responsables</NextLink>}
      >
        {children.data && children.data.length > 0 ? (
          <ul className="m-0 -my-3 list-none p-0">
            {children.data.map((c) => (
              <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-line py-3 last:border-b-0">
                <span className="text-15 font-medium text-ink">{c.name}</span>
                <span className="text-13 text-ink-3">
                  {c.type.label}
                  {c.city && ` · ${c.city}`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-14 text-ink-3">{children.isPending ? 'Chargement…' : 'Aucun nœud rattaché.'}</p>
        )}
      </SettingsCard>
    </>
  );
};

/** Paramètres du secrétariat et délais par type d'acte : chargés à part (lecture réservée aux mêmes capacités). */
const ParishLifeBlock = ({ nodeId, canEdit, identity, aside }: { nodeId: string; canEdit: boolean; identity: React.ReactNode; aside: React.ReactNode }) => {
  const settings = useParishLife(nodeId);
  const typeDelays = useTypeDelays(nodeId);
  if (settings.isPending || typeDelays.isPending) return <LoadingBlock label="Chargement du secrétariat…" lines={4} />;
  const error = settings.error ?? typeDelays.error;
  if (settings.isError || typeDelays.isError) {
    return (
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          {identity}
          <p role="alert" className="m-0 text-14 text-err">
            {isForbidden(error) ? 'Vous n’avez pas accès aux paramètres du secrétariat.' : apiErrorMessage(error)}
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-6">{aside}</div>
      </div>
    );
  }
  return (
    <ParishLifeForm key={settings.data.id} nodeId={nodeId} settings={settings.data} typeDelays={typeDelays.data} canEdit={canEdit} identity={identity} aside={aside} />
  );
};

/** PAR-Parametres : identité (lecture), secrétariat et demandes d’actes (horaires.gerer), lieux de culte et nœuds rattachés. */
export const ParametresScreen = ({ nodeId }: { nodeId: string }) => {
  const canHoraires = useCan('horaires.gerer', nodeId);
  const canStructure = useCan('structure.gerer', nodeId);
  const canEdit = canHoraires || canStructure;
  const node = useNodeSettings(nodeId);
  const ancestors = useQuery(nodeAncestorsQueryOptions(nodeId));

  if (node.isPending) return <LoadingBlock label="Chargement des paramètres…" lines={6} />;
  if (node.isError) {
    return (
      <EmptyState icon="alerte" tone="err" title="Paramètres indisponibles">
        {apiErrorMessage(node.error)}
      </EmptyState>
    );
  }

  const attachment = ancestors.data?.length ? [...ancestors.data].reverse().map((a) => a.name).join(' · ') : undefined;
  const isParish = node.data.type.code === 'paroisse';

  return (
    <div>
      <PageHeader
        compact
        title={isParish ? 'Paramètres de la paroisse' : `Paramètres · ${node.data.name}`}
        description={`${attachment ? `${attachment}. ` : ''}Réservés au curé et au secrétariat ; chaque modification est tracée.`}
      />
      <div className="mt-8">
        <ParishLifeBlock
          nodeId={nodeId}
          canEdit={canEdit}
          identity={<Identity node={node.data} attachment={attachment} />}
          aside={<PlacesAndChildren nodeId={nodeId} isParish={isParish} />}
        />
      </div>
    </div>
  );
};
