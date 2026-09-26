'use client';

import NextLink from 'next/link';
import { useId, useState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Pagination } from '@/components/ui/pagination';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { paths } from '@/config/paths';
import { useBackofficePlaces } from '@/hooks/use-backoffice-places';
import { useDebounce } from '@/hooks/use-debounce';
import { apiErrorMessage, isForbidden } from '@/utils/api-errors';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { type StaffNewsFilters, useStaffNews, useStaffNewsCounts } from '../api/get-staff-news';
import type { ArticleStatus, StaffArticle } from '../api/staff-article';
import { nextSundays } from '../utils/sundays';

import { ArticleStatusCell } from './article-status';

const LIMIT = 10;

const TABS: { key: 'all' | ArticleStatus; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'published', label: 'Publiées' },
  { key: 'scheduled', label: 'Programmées' },
  { key: 'draft', label: 'Brouillons' },
];

const TYPE_LABEL: Record<string, string> = { announcement: 'Annonce', article: 'Article', meditation: 'Méditation' };

/** « Annonce du dimanche · 27.09 · Paroisse » */
const ArticleKicker = ({ article }: { article: StaffArticle }) => {
  const scope = article.scope.place_name ?? article.scope.node_name ?? 'Tout le réseau';
  return (
    <span className="tnum mt-0.5 block text-meta text-ink-3">
      {article.is_sunday_notice && article.sunday_date ? (
        <span className="text-primary">Annonce du dimanche · {dayjs(article.sunday_date).format('DD.MM')}</span>
      ) : (
        (TYPE_LABEL[article.content_type] ?? 'Contenu')
      )}{' '}
      · {scope}
    </span>
  );
};

const ArticleRow = ({ nodeId, article }: { nodeId: string; article: StaffArticle }) => {
  const editHref = paths.espace.annonces.detail.getHref(nodeId, article.id);
  const noun = article.content_type === 'article' ? 'l’article' : 'l’annonce';
  return (
    <Tr>
      <Td className="max-w-0">
        {/* Deux lignes puis coupe, titre complet en infobulle et dans le nom accessible (A11Y-18). */}
        <NextLink
          href={editHref}
          title={frenchTypo(article.title)}
          className={cn('line-clamp-2 break-words text-base text-ink hover:text-primary', article.status === 'draft' ? 'font-semibold' : 'font-medium')}
        >
          {frenchTypo(article.title)}
        </NextLink>
        <ArticleKicker article={article} />
      </Td>
      <Td>
        <ArticleStatusCell article={article} />
      </Td>
      <Td>
        <span className="block font-medium">{article.author_name}</span>
        {article.category && <span className="block text-xs text-ink-3">{article.category.name}</span>}
      </Td>
      <Td className="tnum pr-6 text-right text-xs text-ink-3">{article.status === 'published' ? article.reads_count : '—'}</Td>
      <Td className="whitespace-nowrap text-right">
        <NextLink href={editHref} aria-label={`Modifier ${noun} : ${article.title}`} className="hit inline-flex size-9 items-center justify-center rounded text-ink hover:bg-surface-2">
          <Icon name="crayon" size={18} />
        </NextLink>
        {article.status === 'published' && (
          <NextLink
            href={paths.app.paroisse.annonce.getHref(article.id)}
            aria-label={`Voir côté fidèle : ${article.title}`}
            className="hit inline-flex size-9 items-center justify-center rounded text-ink hover:bg-surface-2"
          >
            <Icon name="oeil" size={18} />
          </NextLink>
        )}
      </Td>
    </Tr>
  );
};

/** PAR-Annonces : contenus du nœud, par état, avec lectures et accès à l'éditeur. */
export const AnnoncesList = ({ nodeId }: { nodeId: string }) => {
  const typeId = useId();
  const searchId = useId();
  const placeId = useId();
  const [tab, setTab] = useState<'all' | ArticleStatus>('all');
  const [type, setType] = useState<StaffNewsFilters['type']>();
  const [search, setSearch] = useState('');
  const [place, setPlace] = useState<number>();
  const [offset, setOffset] = useState(0);
  const q = useDebounce(search.trim(), 300);
  const places = useBackofficePlaces(nodeId);
  const filters: StaffNewsFilters = { status: tab === 'all' ? undefined : tab, type, q: q || undefined, place, limit: LIMIT, offset };
  const sunday = nextSundays(dayjs(), 1)[0];
  const news = useStaffNews(nodeId, filters);
  const counts = useStaffNewsCounts(nodeId);
  const readsThisPage = (news.data?.results ?? []).reduce((sum, a) => sum + a.reads_count, 0);

  const changeTab = (next: typeof tab) => {
    setTab(next);
    setOffset(0);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="tnum m-0 text-meta text-ink-2">
            <span className="text-primary">01</span> — Vie paroissiale
            {counts.data && (
              <>
                {' '}
                · {counts.data.published} publiée{counts.data.published > 1 ? 's' : ''} · {counts.data.draft} brouillon
                {counts.data.draft > 1 ? 's' : ''}
              </>
            )}
          </p>
          <h1 className="m-0 mt-2 font-serif text-title font-normal text-ink">Annonces</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <NextLink
            href={paths.espace.annonces.feuille.getHref(nodeId, sunday)}
            className={cn(buttonVariants({ variant: 'secondary' }), 'hover:no-underline')}
          >
            <Icon name="document" size={16} /> Feuille d’annonces du {dayjs(sunday).format('DD.MM')}
          </NextLink>
          <NextLink href={paths.espace.annonces.nouvelle.getHref(nodeId)} className={cn(buttonVariants(), 'hover:no-underline')}>
            <Icon name="plus" size={16} /> Nouvelle annonce
          </NextLink>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-line">
        <div role="tablist" aria-label="Filtrer par état" className="flex gap-6 overflow-x-auto">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => changeTab(t.key)}
                className={cn(
                  '-mb-px inline-flex h-11 items-center gap-2 border-b-2 text-base transition-colors',
                  active ? 'border-primary font-semibold text-ink' : 'border-transparent text-ink-2 hover:text-primary',
                )}
              >
                {t.label}
                {counts.data && <span className={cn('tnum text-meta', active ? 'text-primary' : 'text-ink-3')}>{counts.data[t.key]}</span>}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <label htmlFor={searchId} className="sr-only">
            Rechercher dans les annonces
          </label>
          <input
            id={searchId}
            type="search"
            value={search}
            placeholder="Rechercher dans les annonces"
            maxLength={100}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            className="h-9 w-64 rounded border border-line-field bg-surface px-3 text-sm text-ink placeholder:text-ink-3"
          />
          {(places.data ?? []).length > 0 && (
            <>
              <label htmlFor={placeId} className="sr-only">
                Portée
              </label>
              <select
                id={placeId}
                value={place ?? ''}
                onChange={(e) => {
                  setPlace(e.target.value ? Number(e.target.value) : undefined);
                  setOffset(0);
                }}
                className="h-9 rounded border border-line-field bg-surface pl-3 pr-8 text-sm text-ink"
              >
                <option value="">Tous les lieux</option>
                {(places.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </>
          )}
          <label htmlFor={typeId} className="sr-only">
            Type de contenu
          </label>
          <select
            id={typeId}
            value={type ?? ''}
            onChange={(e) => {
              setType((e.target.value || undefined) as StaffNewsFilters['type']);
              setOffset(0);
            }}
            className="h-9 rounded border border-line-field bg-surface pl-3 pr-8 text-sm text-ink"
          >
            <option value="">Tous les types</option>
            <option value="announcement">Annonces</option>
            <option value="article">Articles</option>
          </select>
        </div>
      </div>

      <div role="tabpanel" aria-label={TABS.find((t) => t.key === tab)?.label} className="mt-2">
        {news.isPending ? (
          <div className="py-6">
            <LoadingBlock label="Chargement des annonces…" lines={5} />
          </div>
        ) : news.isError ? (
          <EmptyState icon={isForbidden(news.error) ? 'cadenas' : 'alerte'} tone="err" title={isForbidden(news.error) ? 'Accès refusé' : 'Annonces indisponibles'} className="mt-4">
            {apiErrorMessage(news.error)}
          </EmptyState>
        ) : news.data.results.length === 0 ? (
          <EmptyState
            icon="annonce"
            title={q || place ? 'Aucune annonce ne correspond à ces filtres' : tab === 'all' ? 'Aucune annonce pour l’instant' : 'Aucune annonce dans cet état'}
            className="mt-4"
          >
            Les annonces publiées apparaissent dans « Ma paroisse » pour les fidèles qui suivent la paroisse.
          </EmptyState>
        ) : (
          <>
            <Table className="table-fixed" label="Annonces, défilement horizontal">
              <thead>
                <tr>
                  <Th>Annonce</Th>
                  <Th className="w-48">État</Th>
                  <Th className="w-44">Auteur</Th>
                  <Th className="w-20 pr-6 text-right">Lectures</Th>
                  <Th className="w-24">
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {news.data.results.map((article) => (
                  <ArticleRow key={article.id} nodeId={nodeId} article={article} />
                ))}
              </tbody>
            </Table>
            <Pagination offset={offset} limit={LIMIT} total={news.data.count} onChange={setOffset} className="mt-2" />
            <p className="tnum m-0 mt-3 text-meta text-ink-3">
              {news.data.count} contenu{news.data.count > 1 ? 's' : ''} · {readsThisPage} lecture{readsThisPage > 1 ? 's' : ''} sur cette page
            </p>
          </>
        )}
      </div>
    </div>
  );
};
