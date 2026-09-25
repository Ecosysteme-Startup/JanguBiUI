'use client';

import NextLink from 'next/link';
import { useMemo, useState } from 'react';

import { StatusDot } from '@/components/signature/status-dot';
import { buttonVariants } from '@/components/ui/button';
import { Chip, ChipGroup } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Pagination } from '@/components/ui/pagination';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dotDate } from '@/utils/dates';

import { REQUESTS_PAGE_SIZE, useRequests } from '../api/get-requests';
import { type DocumentRequest, documentLabel, reasonLabel } from '../types/request';
import { isOpen } from '../utils/timeline';

import { ActesPrimer } from './actes-primer';

type Filter = 'en-cours' | 'terminees' | 'toutes';

const FILTERS: { key: Filter; label: string; keep: (r: DocumentRequest) => boolean }[] = [
  { key: 'en-cours', label: 'En cours', keep: (r) => isOpen(r.status) },
  { key: 'terminees', label: 'Terminées', keep: (r) => !isOpen(r.status) },
  { key: 'toutes', label: 'Toutes', keep: () => true },
];

/** Précision sous le statut, du point de vue du fidèle. */
const statusHint = (r: DocumentRequest): string => {
  switch (r.status) {
    case 'submitted':
      return 'Non ouverte';
    case 'under_verification':
      return 'Registre ouvert';
    case 'info_requested':
      return 'À vous de répondre';
    case 'ready_for_pickup':
      return 'Au secrétariat';
    case 'collected':
      return r.closed_at ? `Remise le ${dotDate(r.closed_at)}` : 'Original remis';
    case 'rejected':
      return 'Motif transmis';
    case 'cancelled':
      return 'Par vous';
  }
};

const headline = (requests: DocumentRequest[]): string => {
  const ready = requests.filter((r) => r.status === 'ready_for_pickup');
  if (ready.length === 1) return `Une demande prête à retirer à ${ready[0].target_node?.name ?? 'la paroisse'}.`;
  if (ready.length > 1) return `${ready.length} demandes prêtes à retirer.`;
  if (requests.some((r) => r.status === 'info_requested')) return 'Une paroisse attend un complément de votre part.';
  return 'L’acte se demande à la paroisse où le sacrement a été célébré.';
};

/** FID-Demandes : onglets en cours / terminées / toutes, filtre par type, tableau. */
export const RequestsList = () => {
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<Filter>('toutes');
  const [type, setType] = useState<string | null>(null);
  const { data, isPending, isError, refetch } = useRequests(offset);
  const all = useMemo(() => data?.results ?? [], [data]);

  const byTab = all.filter(FILTERS.find((f) => f.key === filter)!.keep);
  const types = [...new Map(byTab.map((r) => [r.document_type, r.document_type_label])).entries()];
  const rows = type ? byTab.filter((r) => r.document_type === type) : byTab;

  return (
    <>
      <NextLink href={paths.app.root.getHref()} className="inline-flex h-8 items-center gap-2 text-sm font-medium">
        <Icon name="fleche-gauche" size={18} />
        Retour · Accueil
      </NextLink>
      <header className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="tnum m-0 text-meta text-ink-2">
            <span className="text-primary">03</span> — Mes demandes d’actes
          </p>
          <h1 className="m-0 mt-3 font-serif text-title font-normal text-ink lg:text-[50px] lg:leading-none">
            Mes demandes <em className="italic text-primary">d’actes</em>
          </h1>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
          {data && <p className="m-0 max-w-xs text-sm text-ink-2 lg:text-right">{headline(all)}</p>}
          <NextLink href={paths.app.demandes.nouvelle.getHref()} className={cn(buttonVariants(), 'hover:no-underline')}>
            <Icon name="plus" size={18} />
            Nouvelle demande
          </NextLink>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-6">
        <section aria-labelledby="dem-liste" className="min-w-0 lg:col-span-8">
          <h2 id="dem-liste" className="sr-only">
            Liste de mes demandes
          </h2>
          <div className="flex items-center justify-between gap-4 border-b border-line">
            <div role="group" aria-label="Filtrer par état" className="flex gap-6 overflow-x-auto lg:gap-8">
              {FILTERS.map((f) => {
                const active = f.key === filter;
                return (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setFilter(f.key);
                      setType(null);
                    }}
                    className={cn(
                      '-mb-px inline-flex h-11 items-center gap-2 whitespace-nowrap border-b-2 text-base',
                      active ? 'border-primary font-semibold text-ink' : 'border-transparent text-ink-2 hover:text-primary',
                    )}
                  >
                    {f.label}
                    <span className={cn('tnum text-meta', active ? 'text-primary' : 'text-ink-3')}>{all.filter(f.keep).length}</span>
                  </button>
                );
              })}
            </div>
            <span className="tnum hidden text-meta text-ink-3 sm:inline">Tri : date de la demande</span>
          </div>

          {types.length > 1 && (
            <ChipGroup label="Filtrer par type d’acte" className="mt-4">
              <Chip pressed={type === null} onClick={() => setType(null)}>
                Tous · {byTab.length}
              </Chip>
              {types.map(([value, label]) => (
                <Chip key={value} pressed={type === value} onClick={() => setType(value)}>
                  {label} · {byTab.filter((r) => r.document_type === value).length}
                </Chip>
              ))}
            </ChipGroup>
          )}

          <div className="mt-4" aria-live="polite">
            {isPending ? (
              <LoadingBlock label="Chargement de vos demandes…" lines={4} />
            ) : isError ? (
              <EmptyState
                tone="err"
                icon="alerte"
                title="Vos demandes n’ont pas pu être chargées."
                action={
                  <button type="button" className={buttonVariants({ variant: 'secondary', size: 'sm' })} onClick={() => refetch()}>
                    Réessayer
                  </button>
                }
              />
            ) : all.length === 0 ? (
              <EmptyState icon="document" title="Aucune demande pour l’instant.">
                Extrait de baptême, attestation de confirmation… Faites votre demande en ligne, puis retirez l’original au secrétariat.
              </EmptyState>
            ) : rows.length === 0 ? (
              <EmptyState icon="document" title={filter === 'en-cours' ? 'Aucune demande en cours.' : 'Aucune demande terminée.'} />
            ) : (
              <RequestsTable rows={rows} />
            )}
          </div>
          {data && (
            <Pagination offset={offset} limit={REQUESTS_PAGE_SIZE} total={data.count} onChange={setOffset} className="mt-2" />
          )}
          <p className="m-0 mt-4 text-sm text-ink-3">Les demandes terminées restent consultables deux ans.</p>
        </section>

        <ActesPrimer className="lg:col-span-4" />
      </div>
    </>
  );
};

const RequestsTable = ({ rows }: { rows: DocumentRequest[] }) => (
  <Table>
    <thead>
      <tr>
        <Th className="w-[40%]">Demande</Th>
        <Th className="hidden w-[26%] md:table-cell">Paroisse du sacrement</Th>
        <Th>Statut</Th>
        <Th className="hidden text-right sm:table-cell">Mise à jour</Th>
        <Th className="w-9">
          <span className="sr-only">Ouvrir</span>
        </Th>
      </tr>
    </thead>
    <tbody>
      {rows.map((r) => (
        <Tr key={r.id}>
          <Td className="h-18 py-3">
            <NextLink href={paths.app.demandes.detail.getHref(r.id)} className="block text-ink hover:text-primary">
              <span className="block text-base font-semibold">{documentLabel(r)}</span>
              <span className="tnum mt-1 block text-xs text-ink-3">
                {r.reference} · {reasonLabel(r)}
              </span>
            </NextLink>
          </Td>
          <Td className="hidden leading-snug text-ink-2 md:table-cell">{r.target_node?.name}</Td>
          <Td>
            <StatusDot status={r.status} />
            <span className="tnum mt-1 block pl-4 text-meta text-ink-3">{statusHint(r)}</span>
          </Td>
          <Td className="tnum hidden text-right text-xs sm:table-cell">{dotDate(r.updated_at)}</Td>
          <Td className="text-right">
            <NextLink
              href={paths.app.demandes.detail.getHref(r.id)}
              aria-label={`Ouvrir la demande ${r.reference}`}
              className="inline-flex size-9 items-center justify-center rounded text-ink hover:bg-surface-2"
            >
              <Icon name="chevron-droite" size={18} />
            </NextLink>
          </Td>
        </Tr>
      ))}
    </tbody>
  </Table>
);
