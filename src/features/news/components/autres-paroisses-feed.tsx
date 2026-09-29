'use client';

import { BellOff, Clock, Newspaper } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Link } from '@/components/ui/link';
import { MediaCard } from '@/components/ui/media-card';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import type { MaParoisse } from '@/lib/paroisses/api';
import { cn } from '@/lib/utils';
import { formatFrDate } from '@/utils/format-date';

import { useFeedSecondaires } from '../api/get-feed-secondaires';

/**
 * Fil « Autres paroisses » (maquette APP-C03b, pendant web) : annonces des
 * paroisses secondaires, dans un fil séparé, sans notification, triées par
 * date (jamais par paroisse ni par popularité). Pilules pour n'en voir
 * qu'une.
 */
export function AutresParoissesFeed({
  secondaires,
}: {
  secondaires: MaParoisse[];
}) {
  const [paroisse, setParoisse] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useFeedSecondaires(paroisse);
  const annonces = data?.results ?? [];
  const options = [
    { id: null, label: 'Toutes' },
    ...secondaires.map((m) => ({ id: m.paroisse.id, label: m.paroisse.name })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div
        role="group"
        aria-label="Filtrer par paroisse"
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {options.map((o) => {
          const active = o.id === paroisse;
          return (
            <button
              key={o.id ?? 'toutes'}
              type="button"
              aria-pressed={active}
              onClick={() => setParoisse(o.id)}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <p className="flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-[13px] leading-[18px] text-muted-foreground">
        <BellOff className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          Les annonces de vos autres paroisses arrivent ici, sans notification.
          Celles de votre paroisse principale restent dans « Ma paroisse ».{' '}
          <Link
            href={`${paths.app.profil.getHref()}#paroisses`}
            className="font-medium text-primary hover:underline"
          >
            Mes paroisses
          </Link>
        </span>
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Impossible de charger les annonces"
          onRetry={() => void refetch()}
        />
      ) : !annonces.length ? (
        <EmptyState
          icon={<Newspaper />}
          title="Aucune annonce"
          description="Vos autres paroisses n’ont pas publié d’annonce récemment."
        />
      ) : (
        <ul
          aria-label="Annonces des autres paroisses"
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {annonces.map((a) => (
            <li key={a.id}>
              <MediaCard
                href={`/app/actus/${a.id}`}
                image={a.cover_image_url ?? undefined}
                imageAlt={a.title}
                aspect="video"
                fallbackIcon={<Newspaper />}
                overline={
                  <span className="flex flex-col gap-0.5">
                    {a.scope?.node_name && (
                      <span className="text-xs font-semibold text-foreground">
                        {a.scope.node_name}
                      </span>
                    )}
                    {a.category && (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {a.category.name}
                      </span>
                    )}
                  </span>
                }
                title={a.title}
                excerpt={a.excerpt ?? undefined}
                meta={
                  a.published_at ? (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" aria-hidden />
                      {formatFrDate(a.published_at, 'short')}
                    </span>
                  ) : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
