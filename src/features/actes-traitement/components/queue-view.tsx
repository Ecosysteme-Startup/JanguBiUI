'use client';

import { useEffect, useState } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Pagination } from '@/components/ui/pagination';
import { LoadingBlock } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { useNode } from '@/hooks/use-node';
import { cn } from '@/utils/cn';
import { plural } from '@/utils/plural';

import { ASSIGNEE_FILTERS, type AssigneeFilter, PERIODS, type Period, QUEUE_PAGE_SIZE, useQueue } from '../api/get-queue';
import { useQueueCounts } from '../api/get-queue-counts';
import { filtersToQuery, useQueueFilters } from '../hooks/use-queue-filters';
import { DOCUMENT_TYPES, REASONS } from '../types/processing';

import { FilterPill } from './filter-pill';
import { QueueTable } from './queue-table';

/** Onglets par statut : le serveur ne filtre qu'un statut à la fois (l'annulée reste dans « Toutes »). */
const TABS: { value: string; label: string }[] = [
  { value: '', label: 'Toutes' },
  { value: 'submitted', label: 'Soumises' },
  { value: 'under_verification', label: 'En vérification' },
  { value: 'info_requested', label: 'Complément demandé' },
  { value: 'ready_for_pickup', label: 'Prêtes à retirer' },
  { value: 'collected', label: 'Retirées' },
  { value: 'rejected', label: 'Rejetées' },
];

/** PAR-Demandes : file de la paroisse, filtres dans l'URL, pagination. */
export const QueueView = ({ nodeId }: { nodeId: string }) => {
  const { filters, update } = useQueueFilters(nodeId);
  const [search, setSearch] = useState(filters.q);
  const debounced = useDebounce(search, 350);
  const queue = useQueue(nodeId, filters);
  const counts = useQueueCounts(nodeId);
  const node = useNode(nodeId);

  useEffect(() => {
    if (debounced !== filters.q) update({ q: debounced });
  }, [debounced, filters.q, update]);

  const countOf = (status: string) => (status ? (counts.data?.counts[status] ?? 0) : (counts.data?.total ?? 0));
  const filtered = Boolean(filters.statut || filters.type || filters.motif || filters.periode || filters.assigne || filters.q || filters.retard);

  return (
    <>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="min-w-0">
          <h1 className="m-0 text-32 font-semibold text-ink">Demandes d’actes</h1>
          <p className="m-0 mt-1 text-16 text-ink-2">
            Les demandes dont le sacrement a été célébré {node.data ? `à ${node.data.name}` : 'dans votre paroisse'}.
          </p>
        </div>
      </header>

      <nav aria-label="Filtrer les demandes par statut" className="mt-6 flex gap-7 overflow-x-auto border-b border-line">
        {TABS.map((tab) => {
          const active = filters.statut === tab.value;
          return (
            <button
              key={tab.value || 'toutes'}
              type="button"
              aria-pressed={active}
              onClick={() => update({ statut: tab.value })}
              className={cn(
                '-mb-px inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-0.5 text-15',
                active ? 'border-primary font-semibold text-ink' : 'border-transparent font-medium text-ink-3 hover:text-primary',
              )}
            >
              {tab.label}
              {counts.data && (
                <span
                  className={cn(
                    'tnum inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-12 font-semibold',
                    active ? 'bg-tint-100 text-tint-800' : 'bg-surface-2 text-ink-2',
                  )}
                >
                  {countOf(tab.value)}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label
          htmlFor="dem-filtre"
          className="flex h-9 w-full items-center gap-2 rounded-10 border border-line-field bg-paper px-3 text-ink-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary sm:w-[300px]"
        >
          <Icon name="recherche" size={16} className="shrink-0" />
          <span className="sr-only">Filtrer la file par nom ou référence</span>
          <input
            id="dem-filtre"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Référence ou nom du demandeur"
            className="h-full min-w-0 flex-1 border-0 bg-transparent text-14 text-ink placeholder:text-ink-3 focus:outline-none"
          />
        </label>
        <FilterPill id="dem-type" label="Type d’acte" value={filters.type} onChange={(type) => update({ type })} allLabel="Type d’acte">
          {DOCUMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </FilterPill>
        <FilterPill id="dem-assigne" label="Assignation" value={filters.assigne} onChange={(v) => update({ assigne: v as AssigneeFilter | '' })} allLabel="Suivie par">
          {ASSIGNEE_FILTERS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </FilterPill>
        <FilterPill id="dem-motif" label="Motif" value={filters.motif} onChange={(motif) => update({ motif })} allLabel="Motif">
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </FilterPill>
        <FilterPill id="dem-periode" label="Période de réception" value={filters.periode} onChange={(v) => update({ periode: v as Period | '' })} allLabel="Reçues le">
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              Reçues : {p.label.toLowerCase()}
            </option>
          ))}
        </FilterPill>
        <button
          type="button"
          aria-pressed={filters.retard}
          onClick={() => update({ retard: !filters.retard })}
          className={cn(
            'hit inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-14 font-medium transition-colors',
            filters.retard ? 'border-line-active bg-tint-50 text-tint-800' : 'border-line bg-paper text-ink hover:border-line-field hover:bg-surface',
          )}
        >
          <span aria-hidden="true" className="size-1.5 rounded-full bg-warn-dot" />
          En retard
          {filters.retard && <Icon name="x" size={14} />}
        </button>
      </div>

      <div className="mt-4" aria-live="polite" aria-busy={queue.isFetching}>
        {queue.isPending ? (
          <LoadingBlock label="Chargement de la file…" lines={6} />
        ) : queue.isError ? (
          <EmptyState tone="err" icon="alerte" title="La file n’a pas pu être chargée.">
            {queue.error.message}
          </EmptyState>
        ) : queue.data.results.length === 0 ? (
          <EmptyState icon="document" title="Aucune demande ne correspond.">
            {filtered ? 'Modifiez ou retirez les filtres pour voir toute la file.' : 'Les demandes adressées à votre paroisse apparaîtront ici.'}
          </EmptyState>
        ) : (
          <QueueTable
            nodeId={nodeId}
            rows={queue.data.results}
            query={filtersToQuery(filters)}
            footer={
              queue.data.count > QUEUE_PAGE_SIZE ? (
                <Pagination
                  offset={(filters.page - 1) * QUEUE_PAGE_SIZE}
                  limit={QUEUE_PAGE_SIZE}
                  total={queue.data.count}
                  onChange={(offset) => update({ page: offset / QUEUE_PAGE_SIZE + 1 })}
                  noun="Demandes"
                  className="w-full"
                />
              ) : (
                <span className="tnum">{plural(queue.data.count, 'demande', 'demandes')}</span>
              )
            }
          />
        )}
      </div>
      <p className="m-0 mt-4 flex items-start gap-2 text-13 text-ink-3">
        <Icon name="info" size={16} className="mt-px shrink-0" />
        Une demande passe en retard quand elle dépasse, sans changement de statut, le délai fixé par la paroisse. L’acte délivré reste un
        original papier, signé et scellé, à retirer au secrétariat.
      </p>
    </>
  );
};
