'use client';

import NextLink from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useRosaryDay } from '@/features/chapelet/api/get-rosary-day';
import { GuidedRosary } from '@/features/chapelet/components/guided-rosary';
import { ParoleNav } from '@/features/chapelet/components/parole-nav';
import { MYSTERIES_BY_DAY } from '@/features/chapelet/utils/rosary';
import { useRosaryToday } from '@/hooks/use-rosary-today';
import { ApiError } from '@/lib/api-client';
import { dayjs } from '@/utils/dates';

const Header = ({ children }: { children?: ReactNode }) => (
  <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
    <div className="min-w-0">
      <h1 className="m-0 text-32 font-semibold text-ink">Chapelet</h1>
      {children}
    </div>
    <ParoleNav current="chapelet" />
  </header>
);

/**
 * Chapelet (FID-Chapelet) : prière personnelle guidée, les mystères du jour ou ceux d'un autre jour
 * (`?jour=0` à `6`, lundi = 0). Le chapelet communautaire est gelé.
 */
export const ChapeletView = ({ jour = null }: { jour?: number | null }) => {
  const today = (dayjs().day() + 6) % 7;
  const other = jour !== null && jour !== today ? jour : null;
  const todayQuery = useRosaryToday();
  const dayQuery = useRosaryDay(other);
  const rosary = other === null ? todayQuery : dayQuery;
  const notConfigured = rosary.error instanceof ApiError && rosary.error.status === 404;

  const group = rosary.data?.day.group.name.replace(/^myst[èe]res\s+/i, '').toLowerCase();
  const usual = MYSTERIES_BY_DAY.find((r) => r.group.toLowerCase() === group)?.days.toLowerCase();

  return (
    <div className="min-w-0 overflow-x-clip [overflow-clip-margin:16px]">
      <Header>
        {rosary.data && (
          <p className="m-0 mt-2 text-16 text-ink-2">
            {other === null
              ? `Le ${rosary.data.day.weekday_display.toLowerCase()}, on médite les mystères ${group}.`
              : `Vous priez les mystères ${group}${usual ? `, ceux du ${usual.replace(' et ', ' et du ')}` : ''}.`}{' '}
            Votre avancée est gardée jusqu’à ce soir.
            {other !== null && (
              <>
                {' '}
                <NextLink href={paths.app.chapelet.getHref()} className="font-medium">
                  Revenir aux mystères du jour
                </NextLink>
              </>
            )}
          </p>
        )}
      </Header>
      {rosary.isPending ? (
        <div className="mt-8">
          <LoadingBlock label="Chargement du chapelet…" lines={6} />
        </div>
      ) : notConfigured ? (
        <EmptyState icon="chapelet" title="Le chapelet du jour n’est pas encore disponible." className="mt-8">
          <p className="m-0">Les mystères de ce jour n’ont pas encore été publiés. Revenez un peu plus tard.</p>
        </EmptyState>
      ) : rosary.isError ? (
        <EmptyState
          tone="err"
          title="Impossible d’afficher le chapelet."
          className="mt-8"
          action={
            <Button variant="outline" onClick={() => rosary.refetch()}>
              Réessayer
            </Button>
          }
        >
          <p className="m-0">{rosary.error instanceof ApiError ? rosary.error.message : 'Le service ne répond pas. Réessayez dans un instant.'}</p>
        </EmptyState>
      ) : rosary.data.day.group.mysteries.length === 0 ? (
        <EmptyState icon="chapelet" title="Les mystères de ce jour ne sont pas encore disponibles." className="mt-8" />
      ) : (
        <GuidedRosary key={rosary.data.day.group.slug} rosary={rosary.data} today={today} />
      )}
    </div>
  );
};
