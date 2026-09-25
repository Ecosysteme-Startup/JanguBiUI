'use client';

import { useEffect, useState } from 'react';

import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { LoadingBlock } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/utils/cn';

import { QUEUE_PAGE_SIZE, useQueue } from '../api/get-queue';
import { useQueueCounts } from '../api/get-queue-counts';
import { useQueueFilters } from '../hooks/use-queue-filters';
import { DOCUMENT_TYPES } from '../types/processing';

import { QueueTable } from './queue-table';

/** Onglets de la maquette : l'annulée reste accessible par « Toutes ». */
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

  useEffect(() => {
    if (debounced !== filters.q) update({ q: debounced });
  }, [debounced, filters.q, update]);

  const countOf = (status: string) => (status ? (counts.data?.counts[status] ?? 0) : (counts.data?.total ?? 0));

  return (
    <>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="tnum m-0 text-meta text-ink-2">
            <span className="text-primary">04</span> — Registre · {counts.data ? `${counts.data.total} demandes dans la file` : 'file de traitement'}
          </p>
          <h1 className="m-0 mt-3 font-serif text-title font-normal text-ink">Demandes d’actes</h1>
        </div>
        <div className="w-full lg:w-[360px]">
          <label htmlFor="dem-filtre" className="sr-only">
            Filtrer la file par nom ou référence
          </label>
          <div className="relative">
            <Icon name="recherche" size={18} className="pointer-events-none absolute left-3.5 top-[15px] text-ink-3" />
            <Input
              id="dem-filtre"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom du demandeur ou référence"
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <nav aria-label="Filtrer les demandes par statut" className="mt-8 flex gap-6 overflow-x-auto border-b border-line">
        {TABS.map((tab) => {
          const active = filters.statut === tab.value;
          return (
            <button
              key={tab.value || 'toutes'}
              type="button"
              aria-pressed={active}
              onClick={() => update({ statut: tab.value })}
              className={cn(
                '-mb-px inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 text-base',
                active ? 'border-primary font-semibold text-ink' : 'border-transparent text-ink-2 hover:text-primary',
              )}
            >
              {tab.label}
              {counts.data && <span className={cn('tnum text-meta', active ? 'text-primary' : 'text-ink-3')}>{countOf(tab.value)}</span>}
            </button>
          );
        })}
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label htmlFor="dem-type" className="sr-only">
          Type d’acte
        </label>
        <div className="w-full sm:w-72">
          <Select id="dem-type" value={filters.type} onChange={(e) => update({ type: e.target.value })} className="h-10">
            <option value="">Type : tous</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <Chip pressed={filters.retard} onClick={() => update({ retard: !filters.retard })}>
          <Icon name="horloge" size={16} />
          En retard
        </Chip>
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
            {filters.statut || filters.type || filters.q || filters.retard
              ? 'Modifiez ou retirez les filtres pour voir toute la file.'
              : 'Les demandes adressées à votre paroisse apparaîtront ici.'}
          </EmptyState>
        ) : (
          <>
            <QueueTable nodeId={nodeId} rows={queue.data.results} />
            <Pagination
              className="mt-2"
              offset={(filters.page - 1) * QUEUE_PAGE_SIZE}
              limit={QUEUE_PAGE_SIZE}
              total={queue.data.count}
              onChange={(offset) => update({ page: offset / QUEUE_PAGE_SIZE + 1 })}
            />
          </>
        )}
      </div>
    </>
  );
};
