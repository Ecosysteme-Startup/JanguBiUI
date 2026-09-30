'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useDebounce } from '@/hooks/use-debounce';
import { plural } from '@/utils/plural';

import { type DirectoryNode, EXCERPT_PARAMS, useDioceses, useDirectory, useDoyennes } from '../api/get-directory';
import { type DirectoryFilters, EMPTY_FILTERS, filtersToParams, filtersToSearch, PAGE_SIZE } from '../utils/filters';

import { ParishMap } from './parish-map';
import { ParishRow } from './parish-row';

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
  const active = useDirectory({ ...filtersToParams(filters), on_platform: true, limit: 1, offset: 0 });
  const total = useDirectory(EXCERPT_PARAMS).data?.count;
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

  const applied = [filters.q, filters.city, filters.diocese, filters.doyenne, filters.active].filter(Boolean).length;

  const results = directory.data?.results ?? [];
  const selected: DirectoryNode | undefined = results.find((p) => p.id === selectedId) ?? results[0];

  return (
    <div className="jb-cascade jb-container pb-20 pt-10">
      <h1 className="m-0 text-32 font-semibold text-ink md:text-40">Trouver une paroisse</h1>
      <p className="m-0 mt-2 max-w-[900px] text-18 text-ink-2">
        {total ? `Les ${total} paroisses de l’annuaire. ` : ''}Celles qui sont sur Jàngu Bi publient elles-mêmes leurs horaires, annonces et
        contacts.
      </p>

      <form
        role="search"
        aria-label="Rechercher une paroisse"
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ q: draft.trim() });
        }}
        className="mt-8 grid grid-cols-1 items-end gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_260px_240px_auto]"
      >
        <Field id="annuaire-q" label="Rechercher" className="md:col-span-2 lg:col-span-1">
          <Input
            type="search"
            icon="recherche"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Nom de la paroisse, quartier ou ville"
            autoComplete="off"
          />
        </Field>
        <Field id="annuaire-diocese" label="Diocèse">
          <Select value={filters.diocese} onChange={(event) => navigate({ diocese: event.target.value, doyenne: '' })}>
            <option value="">Tous les diocèses</option>
            {dioceses.data?.results.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="annuaire-doyenne" label="Doyenné">
          <Select
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
        </Field>
        <div className="flex h-13 items-center rounded-12 border border-line bg-surface px-4 md:col-span-2 lg:col-span-1">
          <Switch label="Sur Jàngu Bi seulement" checked={filters.active} onCheckedChange={(active) => navigate({ active })} />
        </div>
      </form>

      <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] xl:grid-cols-[minmax(0,1fr)_520px]">
        <section aria-label="Liste des paroisses" className="min-w-0">
          <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p aria-live="polite" className="m-0 text-15 text-ink-2">
              {directory.data && (
                <>
                  <strong className="font-semibold text-ink">{plural(directory.data.count, 'paroisse', 'paroisses')}</strong>
                  {!filters.active && active.data ? `, dont ${active.data.count} sur Jàngu Bi` : ''}
                </>
              )}
            </p>
            {applied > 0 && results.length > 0 && (
              <button type="button" onClick={() => navigate(EMPTY_FILTERS)} className="hit text-14 font-semibold text-primary hover:text-primary-strong">
                Effacer les filtres
              </button>
            )}
          </div>
          {directory.isPending ? (
            <div className="mt-3">
              <LoadingBlock label="Recherche des paroisses…" lines={6} />
            </div>
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
                applied > 0 && (
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
              <ul className="m-0 mt-3 list-none overflow-hidden rounded-16 border border-line bg-paper p-0 shadow-card">
                {results.map((parish, index) => (
                  <ParishRow
                    key={parish.id}
                    parish={parish}
                    selected={parish.id === selected?.id}
                    onSelect={() => setSelectedId(parish.id)}
                    last={index === results.length - 1}
                  />
                ))}
              </ul>
              <Pagination
                className="mt-6"
                offset={(filters.page - 1) * PAGE_SIZE}
                limit={PAGE_SIZE}
                total={directory.data.count}
                onChange={(offset) => navigate({ page: offset / PAGE_SIZE + 1 })}
              />
            </>
          )}
        </section>
        <ParishMap parishes={results} selected={selected} onSelect={setSelectedId} className="lg:sticky lg:top-6" />
      </div>
    </div>
  );
};
