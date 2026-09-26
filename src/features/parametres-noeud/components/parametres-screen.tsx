'use client';

import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';

import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { PLACE_KIND_LABELS, useBackofficePlaces } from '@/hooks/use-backoffice-places';
import { nodeAncestorsQueryOptions } from '@/hooks/use-node-ancestors';
import { useCan } from '@/lib/can';
import { apiErrorMessage, isForbidden } from '@/utils/api-errors';
import { dayjs } from '@/utils/dates';

import { useNodeChildren } from '../api/node-children';
import { NODE_STATUS_LABELS, type NodeSettings, useNodeSettings, useParishLife } from '../api/node-settings';

import { ParishLifeForm } from './parish-life-form';
import { SectionTitle } from './section-title';

const Identity = ({ node, attachment }: { node: NodeSettings; attachment: string | undefined }) => (
  <section aria-labelledby="p-id">
    <SectionTitle id="p-id" number="01" aside="Lecture seule">
      Identité
    </SectionTitle>
    <dl className="m-0 mt-3 grid grid-cols-[120px_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
      <dt className="text-ink-3">Nom</dt>
      <dd className="m-0 font-medium text-ink">{node.name}</dd>
      <dt className="text-ink-3">Nature</dt>
      <dd className="m-0 text-ink">{node.type.label}</dd>
      <dt className="text-ink-3">Code</dt>
      <dd className="tnum m-0 text-ink">{node.code}</dd>
      <dt className="text-ink-3">Statut</dt>
      <dd className="m-0 text-ink">
        {NODE_STATUS_LABELS[node.status] ?? node.status}
        {node.erected_at && `, le ${dayjs(node.erected_at).format('DD.MM.YYYY')}`}
      </dd>
      {attachment && (
        <>
          <dt className="text-ink-3">Rattachement</dt>
          <dd className="m-0 text-ink">{attachment}</dd>
        </>
      )}
      <dt className="text-ink-3">Jàngu Bi</dt>
      <dd className="m-0 text-ink">{node.is_active_on_platform ? 'Active sur la plateforme' : 'En préparation'}</dd>
    </dl>
    <p className="m-0 mt-3 text-sm text-ink-3">Gérés par la chancellerie du diocèse. Signalez-lui toute erreur.</p>
  </section>
);

/** Paramètres du secrétariat : chargés à part (lecture réservée aux mêmes capacités). */
const ParishLifeBlock = ({ nodeId, canEdit }: { nodeId: string; canEdit: boolean }) => {
  const settings = useParishLife(nodeId);
  if (settings.isPending) return <LoadingBlock label="Chargement du secrétariat…" lines={4} />;
  if (settings.isError) {
    return (
      <p role="alert" className="m-0 text-sm text-err">
        {isForbidden(settings.error) ? 'Vous n’avez pas accès aux paramètres du secrétariat.' : apiErrorMessage(settings.error)}
      </p>
    );
  }
  return <ParishLifeForm key={settings.data.id} nodeId={nodeId} settings={settings.data} canEdit={canEdit} />;
};

/** PAR-Parametres : identité (lecture), secrétariat et demandes d’actes (horaires.gerer), lieux de culte et nœuds rattachés. */
export const ParametresScreen = ({ nodeId }: { nodeId: string }) => {
  const canHoraires = useCan('horaires.gerer', nodeId);
  const canStructure = useCan('structure.gerer', nodeId);
  const canEdit = canHoraires || canStructure;
  const node = useNodeSettings(nodeId);
  const ancestors = useQuery(nodeAncestorsQueryOptions(nodeId));
  const places = useBackofficePlaces(nodeId);
  const children = useNodeChildren(nodeId);

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
      <p className="tnum m-0 text-meta text-ink-2">
        <span className="text-primary">06</span> — Administration
      </p>
      <h1 className="m-0 mt-2 font-serif text-title font-normal text-ink">{isParish ? 'Paramètres de la paroisse' : `Paramètres · ${node.data.name}`}</h1>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-10">
          <Identity node={node.data} attachment={attachment} />
          <ParishLifeBlock nodeId={nodeId} canEdit={canEdit} />
        </div>
        <div className="flex flex-col gap-10">
          <section aria-labelledby="p-lieux">
            <SectionTitle id="p-lieux" number="03" aside={<NextLink href={paths.espace.horaires.getHref(nodeId)}>Horaires</NextLink>}>
              Lieux de culte
            </SectionTitle>
            {places.data && places.data.length > 0 ? (
              <ul className="m-0 mt-2 list-none p-0">
                {places.data.map((p) => (
                  <li key={p.id} className="border-b border-line py-3">
                    <span className="block font-medium text-ink">{p.name}</span>
                    <span className="block text-sm text-ink-3">
                      {PLACE_KIND_LABELS[p.kind] ?? p.kind}
                      {p.address && ` · ${p.address}`}
                      {!p.is_active && ' · inactif'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 mt-3 text-sm text-ink-3">{places.isPending ? 'Chargement…' : 'Aucun lieu de culte enregistré.'}</p>
            )}
            <p className="m-0 mt-3 text-sm text-ink-3">Un nouveau lieu est créé par la chancellerie, sur demande du curé.</p>
          </section>

          <section aria-labelledby="p-ceb">
            <SectionTitle id="p-ceb" number="04" aside={children.data ? String(children.data.length) : undefined}>
              {isParish ? 'CEB rattachées' : 'Nœuds rattachés'}
            </SectionTitle>
            {children.data && children.data.length > 0 ? (
              <ul className="m-0 mt-2 list-none p-0">
                {children.data.map((c) => (
                  <li key={c.id} className="flex items-baseline justify-between gap-4 border-b border-line py-3">
                    <span className="font-medium text-ink">{c.name}</span>
                    <span className="text-sm text-ink-3">
                      {c.type.label}
                      {c.city && ` · ${c.city}`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 mt-3 text-sm text-ink-3">{children.isPending ? 'Chargement…' : 'Aucun nœud rattaché.'}</p>
            )}
            <NextLink href={paths.espace.equipe.getHref(nodeId)} className="mt-3 inline-block text-sm font-medium">
              Nommer les responsables
            </NextLink>
          </section>
        </div>
      </div>
    </div>
  );
};
