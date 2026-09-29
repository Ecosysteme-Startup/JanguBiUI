'use client';

import NextLink from 'next/link';
import { useMemo, useState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Chip, ChipGroup } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { Pagination } from '@/components/ui/pagination';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { REQUESTS_PAGE_SIZE, useRequests } from '../api/get-requests';
import { type DocumentRequest, documentLabel } from '../types/request';
import { isOpen } from '../utils/timeline';

import { ActesPrimer } from './actes-primer';
import { RequestCard } from './request-card';

type Filter = 'en-cours' | 'terminees';

const FILTERS: Record<Filter, (r: DocumentRequest) => boolean> = {
  'en-cours': (r) => isOpen(r.status),
  terminees: (r) => !isOpen(r.status),
};

/** Ce qui attend le fidèle, en tête de liste (prête à retirer, complément demandé). */
const headline = (requests: DocumentRequest[]): { tone: 'ok' | 'warn'; text: string } | null => {
  const ready = requests.filter((r) => r.status === 'ready_for_pickup');
  if (ready.length === 1) return { tone: 'ok', text: `Une demande prête à retirer à ${ready[0].target_node?.name ?? 'la paroisse'}.` };
  if (ready.length > 1) return { tone: 'ok', text: `${ready.length} demandes prêtes à retirer.` };
  if (requests.some((r) => r.status === 'info_requested')) return { tone: 'warn', text: 'Une paroisse attend un complément de votre part.' };
  return null;
};

const ListSkeleton = () => (
  <div role="status" data-testid="demandes-squelette" className="mt-6 flex flex-col gap-4">
    <span className="sr-only">Chargement de vos demandes…</span>
    {[0, 1].map((i) => (
      <Skeleton key={i} className="h-[184px] rounded-16" />
    ))}
  </div>
);

/** FID-Demandes : en cours / terminées, filtre par type d'acte, cartes de suivi. */
export const RequestsList = () => {
  const [offset, setOffset] = useState(0);
  const [chosen, setChosen] = useState<Filter | null>(null);
  const [type, setType] = useState<string | null>(null);
  const { data, isPending, isError, refetch } = useRequests(offset);
  const all = useMemo(() => data?.results ?? [], [data]);

  // Sans choix explicite : les demandes en cours, ou les terminées s'il n'y en a aucune en cours.
  const filter: Filter = chosen ?? (all.length > 0 && !all.some(FILTERS['en-cours']) ? 'terminees' : 'en-cours');
  const byTab = all.filter(FILTERS[filter]);
  const types = [...new Map(byTab.map((r) => [r.document_type, r.document_type_label])).entries()];
  const rows = type ? byTab.filter((r) => r.document_type === type) : byTab;
  const lastClosed = all.filter(FILTERS.terminees).sort((a, b) => (b.closed_at ?? b.updated_at).localeCompare(a.closed_at ?? a.updated_at))[0];
  const alert = data ? headline(all) : null;

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div>
          <h1 className="m-0 text-28 font-semibold text-ink sm:text-32">Mes demandes</h1>
          <p className="m-0 mt-2 text-16 text-ink-2">Vos demandes d’actes, adressées à chaque paroisse où le sacrement a été célébré.</p>
        </div>
        <NextLink href={paths.app.demandes.nouvelle.getHref()} className={cn(buttonVariants({ size: 'lg' }), 'self-start whitespace-nowrap hover:no-underline sm:self-auto')}>
          <Icon name="plus" size={20} />
          Nouvelle demande
        </NextLink>
      </header>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_336px]">
        <section aria-labelledby="dem-liste" className="min-w-0">
          <h2 id="dem-liste" className="sr-only">
            Liste de mes demandes
          </h2>
          {alert && <Notice tone={alert.tone} title={alert.text} className="mb-6" />}
          <SegmentedControl
            label="Statut des demandes"
            size="sm"
            block
            className="w-full sm:w-80"
            value={filter}
            options={[
              ['en-cours', 'En cours'],
              ['terminees', 'Terminées'],
            ]}
            counts={{ 'en-cours': all.filter(FILTERS['en-cours']).length, terminees: all.filter(FILTERS.terminees).length }}
            onChange={(value) => {
              setChosen(value);
              setType(null);
            }}
          />

          {types.length > 1 && (
            <ChipGroup label="Filtrer par type d’acte" className="mt-4">
              <Chip pressed={type === null} count={byTab.length} onClick={() => setType(null)}>
                Tous
              </Chip>
              {types.map(([value, label]) => (
                <Chip key={value} pressed={type === value} count={byTab.filter((r) => r.document_type === value).length} onClick={() => setType(value)}>
                  {label}
                </Chip>
              ))}
            </ChipGroup>
          )}

          <div aria-live="polite">
            {isPending ? (
              <ListSkeleton />
            ) : isError ? (
              <EmptyState
                tone="err"
                icon="alerte"
                className="mt-6"
                title="Vos demandes n’ont pas pu être chargées."
                action={
                  <button type="button" className={buttonVariants({ variant: 'secondary', size: 'sm' })} onClick={() => refetch()}>
                    Réessayer
                  </button>
                }
              />
            ) : all.length === 0 ? (
              <EmptyState icon="document" className="mt-6" title="Aucune demande pour l’instant.">
                Extrait de baptême, attestation de confirmation… Faites votre demande en ligne, puis retirez l’original au secrétariat.
              </EmptyState>
            ) : rows.length === 0 ? (
              <EmptyState icon="document" className="mt-6" title={filter === 'en-cours' ? 'Aucune demande en cours.' : 'Aucune demande terminée.'} />
            ) : (
              <ul aria-label={filter === 'en-cours' ? 'Demandes en cours' : 'Demandes terminées'} className="m-0 mt-6 flex list-none flex-col gap-4 p-0">
                {rows.map((r) => (
                  <RequestCard key={r.id} request={r} />
                ))}
              </ul>
            )}
          </div>
          {data && data.count > REQUESTS_PAGE_SIZE && (
            <Pagination offset={offset} limit={REQUESTS_PAGE_SIZE} total={data.count} onChange={setOffset} className="mt-4" />
          )}
          {filter === 'en-cours' && lastClosed ? (
            <p className="m-0 mt-4 px-1 text-14 text-ink-3">
              Dernière demande terminée : {lastClosed.reference}, {documentLabel(lastClosed).toLowerCase()},{' '}
              {lastClosed.status_label.toLowerCase()} le {dayjs(lastClosed.closed_at ?? lastClosed.updated_at).format('D MMM')}.
            </p>
          ) : (
            data && <p className="m-0 mt-4 px-1 text-14 text-ink-3">Les demandes terminées restent consultables deux ans.</p>
          )}
        </section>

        <ActesPrimer />
      </div>
    </>
  );
};
