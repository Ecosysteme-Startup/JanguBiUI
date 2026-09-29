'use client';

import { Clock, Eye, Newspaper } from 'lucide-react';
import { useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Card } from '@/components/ui/card/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { MediaCard } from '@/components/ui/media-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMesParoisses } from '@/lib/paroisses/api';
import { cn } from '@/lib/utils';
import { formatFrDate } from '@/utils/format-date';

import { useFeedArticles } from '../api/get-articles';
import type { Article } from '../types';

import { ArticleTypeBadge } from './article-type-badge';
import { AutresParoissesFeed } from './autres-paroisses-feed';
import {
  ALL_SCOPE,
  NewsScopeFilter,
  scopeFilterToParams,
  type ScopeFilterValue,
} from './news-scope-filter';

function ArticlesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} variant="elevated" className="overflow-hidden">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function articleMeta(article: Article) {
  return (
    <div className="flex items-center gap-3">
      {article.published_at && (
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {formatFrDate(article.published_at, 'short')}
        </span>
      )}
      <span className="flex items-center gap-1">
        <Eye className="size-3" />
        {article.views_count}
      </span>
    </div>
  );
}

type Fil = 'principale' | 'autres';

/** « Ma paroisse · Autres paroisses » (maquette APP-C03b, décisions 6-8). */
function ChoixFil({
  value,
  onChange,
}: {
  value: Fil;
  onChange: (v: Fil) => void;
}) {
  const fils: { v: Fil; label: string }[] = [
    { v: 'principale', label: 'Ma paroisse' },
    { v: 'autres', label: 'Autres paroisses' },
  ];
  return (
    <div
      role="tablist"
      aria-label="Fil d’annonces"
      tabIndex={-1}
      className="inline-flex gap-0.5 rounded-xl bg-muted p-1"
      onKeyDown={(e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        onChange(value === 'principale' ? 'autres' : 'principale');
      }}
    >
      {fils.map(({ v, label }) => {
        const selected = v === value;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(v)}
            className={cn(
              'h-9 rounded-lg px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              selected
                ? 'bg-card font-semibold text-foreground shadow-soft-sm'
                : 'font-medium text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function ArticlesFeed() {
  // Paroisses secondaires : leurs annonces sont dans un fil séparé.
  const mesParoisses = useMesParoisses();
  const secondaires = (mesParoisses.data ?? []).filter((m) => !m.principale);
  const [fil, setFil] = useState<Fil>('principale');
  const autres = fil === 'autres' && secondaires.length > 0;

  // Fil AGRÉGÉ (Chantier 7b) filtrable par portée : « Tous » = l'agrégat inchangé,
  // sinon le filtre serveur (?scope_type=&scope_id=) restreint à la portée choisie.
  const [scope, setScope] = useState<ScopeFilterValue>(ALL_SCOPE);
  const { data, isLoading, isError, refetch } = useFeedArticles({
    limit: 20,
    ...scopeFilterToParams(scope),
  });

  const articles = data?.results ?? [];
  const [featured, ...rest] = articles;

  useRegisterPageMeta({ title: 'Actualités', subtitle: "La vie de l'Église" });

  return (
    <div className="flex flex-col">
      <ContentContainer>
        {secondaires.length > 0 && (
          <div className="mb-4">
            <ChoixFil value={fil} onChange={setFil} />
          </div>
        )}
        {autres ? (
          <AutresParoissesFeed secondaires={secondaires} />
        ) : (
          <>
            <div className="mb-4">
              <NewsScopeFilter value={scope} onChange={setScope} />
            </div>

            {isLoading ? (
              <ArticlesSkeleton />
            ) : isError ? (
              <ErrorState
                title="Impossible de charger les actualités"
                onRetry={() => refetch()}
              />
            ) : !articles.length ? (
              <EmptyState
                icon={<Newspaper />}
                title="Aucune actualité"
                description="Aucune actualité n'est disponible pour cette portée."
              />
            ) : (
              <div className="flex flex-col gap-4">
                {/* Article à la une */}
                <MediaCard
                  featured
                  href={`/app/actus/${featured.id}`}
                  image={featured.cover_image_url}
                  imageAlt={featured.title}
                  aspect="wide"
                  fallbackIcon={<Newspaper />}
                  overline={
                    <>
                      <ArticleTypeBadge contentType={featured.content_type} />
                      {featured.category && (
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {featured.category.name}
                        </span>
                      )}
                    </>
                  }
                  title={featured.title}
                  excerpt={featured.excerpt ?? undefined}
                  meta={articleMeta(featured)}
                />

                {/* Reste — grille 2 colonnes en md+ */}
                {rest.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {rest.map((article) => (
                      <MediaCard
                        key={article.id}
                        href={`/app/actus/${article.id}`}
                        image={article.cover_image_url}
                        imageAlt={article.title}
                        aspect="video"
                        fallbackIcon={<Newspaper />}
                        overline={
                          <ArticleTypeBadge
                            contentType={article.content_type}
                          />
                        }
                        title={article.title}
                        excerpt={article.excerpt ?? undefined}
                        meta={articleMeta(article)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </ContentContainer>
    </div>
  );
}
