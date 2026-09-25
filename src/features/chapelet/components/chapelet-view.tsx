'use client';

import NextLink from 'next/link';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useRosaryToday } from '@/features/chapelet/api/get-rosary-today';
import { GuidedRosary } from '@/features/chapelet/components/guided-rosary';
import { ApiError } from '@/lib/api-client';

/** Chapelet du jour (FID-Chapelet) : prière personnelle guidée. Le chapelet communautaire est gelé. */
export const ChapeletView = () => {
  const rosary = useRosaryToday();
  const notConfigured = rosary.error instanceof ApiError && rosary.error.status === 404;
  return (
    <div className="mx-auto max-w-[1200px]">
      <NextLink
        href={paths.app.parole.getHref()}
        className="mb-6 inline-flex h-8 items-center gap-2 text-sm font-medium text-primary hover:text-primary-strong"
      >
        <Icon name="fleche-gauche" size={16} />
        Retour · Lectures du jour
      </NextLink>
      {rosary.isPending ? (
        <LoadingBlock label="Chargement du chapelet…" lines={6} />
      ) : notConfigured ? (
        <EmptyState icon="chapelet" title="Le chapelet du jour n’est pas encore disponible.">
          <p className="m-0">Les mystères de ce jour n’ont pas encore été publiés. Revenez un peu plus tard.</p>
        </EmptyState>
      ) : rosary.isError ? (
        <EmptyState
          tone="err"
          title="Impossible d’afficher le chapelet."
          action={
            <Button variant="secondary" onClick={() => rosary.refetch()}>
              Réessayer
            </Button>
          }
        >
          <p className="m-0">{rosary.error instanceof ApiError ? rosary.error.message : 'Le service ne répond pas. Réessayez dans un instant.'}</p>
        </EmptyState>
      ) : rosary.data.day.group.mysteries.length === 0 ? (
        <EmptyState icon="chapelet" title="Les mystères de ce jour ne sont pas encore disponibles." />
      ) : (
        <GuidedRosary rosary={rosary.data} />
      )}
    </div>
  );
};
