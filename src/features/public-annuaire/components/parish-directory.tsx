'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { LoadingBlock } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { plural } from '@/utils/plural';

import { type DirectoryNode, useDioceses, useDirectory, useDoyennes } from '../api/get-directory';
import { type DirectoryFilters, EMPTY_FILTERS, filtersToParams, filtersToSearch, PAGE_SIZE } from '../utils/filters';

import { ParishMap } from './parish-map';
import { ParishRow } from './parish-row';

type AppliedFilter = { key: string; label: string; clear: Partial<DirectoryFilters> };


/**
 * Annuaire public (PUB-Paroisses) : recherche, diocèse, doyenné, paroisses actives ; les
 * filtres et la page vivent dans l'URL (partageable, retour arrière). Liste paginée et carte
 * schématique des positions connues.
 */
export const ParishDirectory = ({ filters }: { filters: DirectoryFilters }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [draft, setDraft] = useState(filters.q);
  const debouncedQ = useDebounce(draft, 300);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const directory = useDirectory(filtersToParams(filters));
  const dioceses = useDioceses();
  const doyennes = useDoyennes(filters.diocese || undefined);

  const navigate = (patch: Partial<DirectoryFilters>) => {
    const next = { ...filters, page: 1, ...patch };
    router.replace(`${pathname}${filtersToSearch(next)}`, { scroll: false });
  };

  // Recherche saisie : appliquée à l'URL après une courte pause.
  useEffect(() => {
    if (debouncedQ.trim() !== filters.q) navigate({ q: debouncedQ.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  // Navigation arrière ou lien externe : le champ suit l'URL.
  useEffect(() => {
    setDraft((current) => (current.trim() === filters.q ? current : filters.q));
  }, [filters.q]);

  const dioceseName = dioceses.data?.results.find((d) => d.id === filters.diocese)?.name;
  const doyenneName = doyennes.data?.results.find((d) => d.id === filters.doyenne)?.name;
  const candidates: (AppliedFilter | null)[] = [
    filters.q ? { key: 'q', label: `« ${filters.q} »`, clear: { q: '' } } : null,
    filters.city ? { key: 'city', label: `Ville : ${filters.city}`, clear: { city: '' } } : null,
    filters.diocese ? { key: 'diocese', label: dioceseName ?? 'Diocèse', clear: { diocese: '', doyenne: '' } } : null,
    filters.doyenne ? { key: 'doyenne', label: doyenneName ?? 'Doyenné', clear: { doyenne: '' } } : null,
    filters.active ? { key: 'active', label: 'Active sur Jàngu Bi', clear: { active: false } } : null,
  ];
  const applied = candidates.filter((f): f is AppliedFilter => f !== null);

  const results = directory.data?.results ?? [];
  const selected: DirectoryNode | undefined = results.find((p) => p.id === selectedId) ?? results[0];

  return (
    <div>
      <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="tnum m-0 flex items-center gap-4 text-meta text-ink-2">
            <span className="text-primary">Annuaire</span>
            <span aria-hidden="true" className="inline-block h-px w-10 bg-ink" />
            <span>Église catholique au Sénégal</span>
          </p>
          <h1 className="m-0 mt-4 font-serif text-title font-normal text-ink md:text-h1">
            Trouver une <em className="italic text-primary">paroisse</em>
          </h1>
        </div>
        <p className="m-0 text-body text-ink-2 lg:col-span-4 lg:col-start-9">
          Adresses, lieux de culte et horaires des messes. Les fiches des paroisses actives sont tenues à jour par leur secrétariat.
        </p>
      </div>

      <form
        role="search"
        aria-label="Rechercher une paroisse"
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ q: draft.trim() });
        }}
        className="mt-10 grid grid-cols-1 items-end gap-x-6 gap-y-4 border-t border-ink pt-6 md:grid-cols-2 lg:grid-cols-12"
      >
        <div className="flex flex-col gap-2 lg:col-span-5">
          <label htmlFor="annuaire-q" className="text-sm font-semibold text-ink">
            Paroisse, quartier ou ville
          </label>
          <div className="relative">
            <Icon name="recherche" size={20} className="pointer-events-none absolute left-3.5 top-3.5 text-ink-3" />
            <Input
              id="annuaire-q"
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ex. Point E, Médina, Saint-Joseph"
              className="pl-11"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 lg:col-span-3">
          <label htmlFor="annuaire-diocese" className="text-sm font-semibold text-ink">
            Diocèse
          </label>
          <Select id="annuaire-diocese" value={filters.diocese} onChange={(event) => navigate({ diocese: event.target.value, doyenne: '' })}>
            <option value="">Tous les diocèses</option>
            {dioceses.data?.results.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2 lg:col-span-2">
          <label htmlFor="annuaire-doyenne" className="text-sm font-semibold text-ink">
            Doyenné
          </label>
          <Select
            id="annuaire-doyenne"
            value={filters.doyenne}
            disabled={!filters.diocese || !doyennes.data?.results.length}
            onChange={(event) => navigate({ doyenne: event.target.value })}
          >
            <option value="">Tous les doyennés</option>
            {doyennes.data?.results.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name.replace(/^Doyenné (de la |des |du |de )?/i, '')}
              </option>
            ))}
          </Select>
        </div>
        <Choice
          label="Active sur Jàngu Bi"
          checked={filters.active}
          onChange={(event) => navigate({ active: event.target.checked })}
          className="flex h-12 items-center rounded border border-line px-3 lg:col-span-2 [&>input]:mt-0"
        />
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Filtres appliqués" className="flex flex-wrap items-center gap-2">
          <span className="tnum mr-2 text-meta text-ink-3">Filtres</span>
          {applied.length === 0 && <span className="text-sm text-ink-3">aucun</span>}
          {applied.map((filter) => (
            <button
              key={filter.key}
              type="button"
              aria-label={`Retirer le filtre ${filter.label}`}
              onClick={() => navigate(filter.clear)}
              className="inline-flex h-8 items-center gap-2 rounded border border-ink bg-ink pl-3 pr-2.5 text-sm text-paper hover:bg-ink-2"
            >
              {filter.label}
              <Icon name="x" size={14} />
            </button>
          ))}
        </div>
        <p aria-live="polite" className="m-0 text-sm text-ink-2">
          {directory.data && (
            <>
              <strong className="font-semibold text-ink">{plural(directory.data.count, 'paroisse', 'paroisses')}</strong> · triées par nom
            </>
          )}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-6">
        <section aria-label="Liste des paroisses" className="lg:col-span-7">
          {directory.isPending ? (
            <LoadingBlock label="Recherche des paroisses…" lines={6} />
          ) : directory.isError ? (
            <EmptyState
              tone="err"
              icon="alerte"
              title="L’annuaire n’a pas pu être chargé."
              action={
                <Button variant="secondary" onClick={() => directory.refetch()}>
                  Réessayer
                </Button>
              }
            >
              Le service ne répond pas. Réessayez dans un instant.
            </EmptyState>
          ) : results.length === 0 ? (
            <EmptyState
              icon="recherche"
              title="Aucune paroisse ne correspond à votre recherche."
              action={
                applied.length > 0 && (
                  <Button variant="secondary" onClick={() => navigate(EMPTY_FILTERS)}>
                    Effacer les filtres
                  </Button>
                )
              }
            >
              Essayez le nom du saint patron, du quartier ou de la ville.
            </EmptyState>
          ) : (
            <>
              <div
                aria-hidden="true"
                className="tnum hidden h-10 grid-cols-[40px_minmax(0,1fr)_150px_140px_20px] items-center gap-4 border-b border-ink text-meta text-ink-3 md:grid"
              >
                <span>N°</span>
                <span>Paroisse</span>
                <span>Messes du dimanche</span>
                <span>Sur Jàngu Bi</span>
                <span />
              </div>
              <ol className="m-0 list-none p-0">
                {results.map((parish, index) => (
                  <ParishRow
                    key={parish.id}
                    parish={parish}
                    number={(filters.page - 1) * PAGE_SIZE + index + 1}
                    selected={parish.id === selected?.id}
                    onSelect={() => setSelectedId(parish.id)}
                  />
                ))}
              </ol>
              <Pagination
                className="mt-2"
                offset={(filters.page - 1) * PAGE_SIZE}
                limit={PAGE_SIZE}
                total={directory.data.count}
                onChange={(offset) => navigate({ page: offset / PAGE_SIZE + 1 })}
              />
            </>
          )}
        </section>
        <ParishMap parishes={results} selected={selected} onSelect={setSelectedId} className="lg:sticky lg:top-6 lg:col-span-5" />
      </div>
    </div>
  );
};
