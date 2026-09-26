'use client';

import NextLink from 'next/link';
import { useId, useState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useBackofficePlaces } from '@/hooks/use-backoffice-places';
import { useDebounce } from '@/hooks/use-debounce';
import { useNode } from '@/hooks/use-node';
import { apiErrorMessage, isForbidden } from '@/utils/api-errors';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { ofParish } from '@/utils/parish-name';
import { plural } from '@/utils/plural';

import { type StaffNewsFilters, useStaffNews, useStaffNewsCounts } from '../api/get-staff-news';
import { nextSundays } from '../utils/sundays';

import { type AnnoncesTab, AnnoncesTable } from './annonces-table';
import { DraftsPanel } from './drafts-panel';
import { FilterSelect } from './filter-select';
import { StatusTabs } from './status-tabs';

const LIMIT = 10;

const TABS: { key: AnnoncesTab; label: string }[] = [
  { key: 'published', label: 'Publiées' },
  { key: 'scheduled', label: 'Programmées' },
  { key: 'draft', label: 'Brouillons' },
  { key: 'unpublished', label: 'Retirées' },
  { key: 'all', label: 'Toutes' },
];

const EMPTY_TITLE: Record<AnnoncesTab, string> = {
  published: 'Aucune annonce publiée',
  scheduled: 'Aucune annonce programmée',
  draft: 'Aucun brouillon',
  unpublished: 'Aucune annonce retirée',
  all: 'Aucune annonce pour l’instant',
};

/** PAR-Annonces : contenus du nœud, par état, avec lectures et accès à l'éditeur. */
export const AnnoncesList = ({ nodeId }: { nodeId: string }) => {
  const typeId = useId();
  const searchId = useId();
  const placeId = useId();
  const [tab, setTab] = useState<AnnoncesTab>('published');
  const [type, setType] = useState<StaffNewsFilters['type']>();
  const [search, setSearch] = useState('');
  const [place, setPlace] = useState<number>();
  const [offset, setOffset] = useState(0);
  const q = useDebounce(search.trim(), 300);
  const node = useNode(nodeId);
  const places = useBackofficePlaces(nodeId);
  const filters: StaffNewsFilters = { status: tab === 'all' ? undefined : tab, type, q: q || undefined, place, limit: LIMIT, offset };
  const sunday = nextSundays(dayjs(), 1)[0];
  const news = useStaffNews(nodeId, filters);
  const counts = useStaffNewsCounts(nodeId);

  const resetting =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setOffset(0);
    };
  const changeTab = resetting(setTab);

  return (
    <div>
      <PageHeader
        compact
        title="Annonces"
        description={`Ce que les fidèles ${node.data ? ofParish(node.data.name) : 'de la paroisse'} lisent dans l’application et sur la fiche publique.`}
        actions={
          <NextLink href={paths.espace.annonces.nouvelle.getHref(nodeId)} className={cn(buttonVariants(), 'min-h-11 px-5 hover:no-underline')}>
            <Icon name="plus" size={18} /> Nouvelle annonce
          </NextLink>
        }
      />

      <DraftsPanel nodeId={nodeId} sunday={sunday} draftCount={counts.data?.draft} onShowDrafts={() => changeTab('draft')} />

      <div className="mt-8">
        <StatusTabs
          label="Filtrer par état"
          value={tab}
          onChange={changeTab}
          items={TABS.map((t) => ({ ...t, count: counts.data?.[t.key] }))}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-[300px]">
          <label htmlFor={searchId} className="sr-only">
            Rechercher dans les annonces
          </label>
          <Input
            id={searchId}
            type="search"
            icon="recherche"
            controlSize="sm"
            value={search}
            placeholder="Rechercher dans les annonces"
            maxLength={100}
            onChange={(e) => resetting(setSearch)(e.target.value)}
            className="h-9 rounded-10 pl-10 text-14"
          />
        </div>
        <FilterSelect id={typeId} label="Type de contenu" value={type ?? ''} onChange={(v) => resetting(setType)((v || undefined) as StaffNewsFilters['type'])}>
          <option value="">Type</option>
          <option value="announcement">Annonces</option>
          <option value="article">Articles</option>
        </FilterSelect>
        {(places.data ?? []).length > 0 && (
          <FilterSelect id={placeId} label="Lieu" value={place ? String(place) : ''} onChange={(v) => resetting(setPlace)(v ? Number(v) : undefined)}>
            <option value="">Lieu</option>
            {(places.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </FilterSelect>
        )}
      </div>

      <div role="tabpanel" aria-label={TABS.find((t) => t.key === tab)?.label}>
        {news.isPending ? (
          <div className="py-6">
            <LoadingBlock label="Chargement des annonces…" lines={5} />
          </div>
        ) : news.isError ? (
          <EmptyState icon={isForbidden(news.error) ? 'cadenas' : 'alerte'} tone="err" title={isForbidden(news.error) ? 'Accès refusé' : 'Annonces indisponibles'} className="mt-4">
            {apiErrorMessage(news.error)}
          </EmptyState>
        ) : news.data.results.length === 0 ? (
          <EmptyState icon="annonce" title={q || place || type ? 'Aucune annonce ne correspond à ces filtres' : EMPTY_TITLE[tab]} className="mt-4 rounded-16 border border-line">
            Les annonces publiées apparaissent dans « Ma paroisse » pour les fidèles qui suivent la paroisse.
          </EmptyState>
        ) : (
          <AnnoncesTable
            nodeId={nodeId}
            tab={tab}
            articles={news.data.results}
            footer={
              <>
                <Pagination offset={offset} limit={LIMIT} total={news.data.count} onChange={setOffset} className="flex-1" />
                <span className="tnum ml-auto">{plural(news.data.count, 'annonce', 'annonces')}</span>
              </>
            }
          />
        )}
      </div>
    </div>
  );
};
