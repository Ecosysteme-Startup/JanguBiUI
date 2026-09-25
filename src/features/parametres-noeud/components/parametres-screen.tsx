'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { PLACE_KIND_LABELS, useBackofficePlaces } from '@/hooks/use-backoffice-places';
import { nodeAncestorsQueryOptions } from '@/hooks/use-node-ancestors';
import { useCan } from '@/lib/can';
import { apiErrorCode, apiErrorMessage, apiFieldErrors, isForbidden } from '@/utils/api-errors';
import { dayjs } from '@/utils/dates';

import { useNodeChildren } from '../api/node-children';
import { NODE_STATUS_LABELS, type NodeSettings, useNodeSettings, useUpdateNodeSettings } from '../api/node-settings';

const schema = z.object({
  address: z.string().trim().max(300, '300 caractères au plus.'),
  city: z.string().trim().max(100, '100 caractères au plus.'),
});
type Values = z.infer<typeof schema>;

const SectionTitle = ({ id, number, children, aside }: { id: string; number: string; children: React.ReactNode; aside?: React.ReactNode }) => (
  <h2 id={id} className="tnum m-0 flex justify-between gap-4 border-t border-line-strong pt-2 text-meta font-normal text-ink-2">
    <span>
      <span className="text-primary">{number}</span> — {children}
    </span>
    {aside && <span className="text-ink-3">{aside}</span>}
  </h2>
);

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

const SettingsForm = ({ nodeId, node, canEdit }: { nodeId: string; node: NodeSettings; canEdit: boolean }) => {
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, reset, setError, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { address: node.address, city: node.city },
  });
  const update = useUpdateNodeSettings(nodeId, {
    onSuccess: (updated) => {
      reset({ address: updated.address, city: updated.city });
      setSaved(true);
    },
  });
  const dirtyCount = Object.keys(formState.dirtyFields).length;

  const onSubmit = handleSubmit(async (v) => {
    setSaved(false);
    try {
      await update.mutateAsync({ address: v.address, city: v.city });
    } catch (error) {
      Object.entries(apiFieldErrors(error)).forEach(([field, message]) => {
        if (field === 'address' || field === 'city') setError(field, { message });
      });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate aria-labelledby="p-sec">
      <SectionTitle id="p-sec" number="02" aside="Visible sur la fiche publique">
        Secrétariat
      </SectionTitle>
      {!canEdit && (
        <Notice tone="info" title="Modification réservée à la chancellerie" className="mt-3">
          Le serveur n’accepte la modification d’un nœud qu’avec la capacité « Structure ». Transmettez les corrections au chancelier.
        </Notice>
      )}
      <div className="mt-4 flex flex-col gap-4">
        <Field id="p-adr" label="Adresse" error={formState.errors.address?.message}>
          <Input {...register('address')} disabled={!canEdit} />
        </Field>
        <Field id="p-ville" label="Ville" error={formState.errors.city?.message}>
          <Input {...register('city')} disabled={!canEdit} />
        </Field>
      </div>
      <p className="m-0 mt-3 min-h-5 text-sm" aria-live="polite">
        {saved && <span className="text-ok">Paramètres enregistrés.</span>}
      </p>
      {update.isError && (
        <p role="alert" className="m-0 mt-2 text-sm text-err">
          {apiErrorCode(update.error) === 'mfa_required'
            ? 'Validez d’abord votre double authentification, puis recommencez.'
            : isForbidden(update.error)
              ? 'Vous n’avez pas la capacité de modifier ce nœud.'
              : apiErrorMessage(update.error)}
        </p>
      )}
      {canEdit && (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          <span className="tnum text-meta text-ink-3">{dirtyCount > 0 ? `${dirtyCount} modification${dirtyCount > 1 ? 's' : ''}` : 'Aucune modification'}</span>
          <Button variant="secondary" disabled={dirtyCount === 0} onClick={() => reset()}>
            Annuler
          </Button>
          <Button type="submit" disabled={dirtyCount === 0 || update.isPending}>
            {update.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </form>
  );
};

/** PAR-Parametres : identité (lecture), coordonnées du secrétariat, lieux de culte et nœuds rattachés. */
export const ParametresScreen = ({ nodeId }: { nodeId: string }) => {
  const canEdit = useCan('structure.gerer', nodeId);
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
          <SettingsForm key={node.data.id} nodeId={nodeId} node={node.data} canEdit={canEdit} />
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
