'use client';

import { Clock, MapPin, PackageCheck } from 'lucide-react';
import Link from 'next/link';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';

import { useDocumentRequests } from '../api/get-documents';

function VaultSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="space-y-3 rounded-2xl border border-border bg-card p-4"
        >
          <Skeleton className="size-10 rounded-xl" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/**
 * Actes prêts à retirer (statut `ready_for_pickup`). Aucun acte n'est délivré
 * par voie numérique : l'original se retire au secrétariat indiqué.
 */
export function VaultContent() {
  const { data, isLoading, isError, refetch } = useDocumentRequests({
    status: 'ready_for_pickup',
  });
  const documents = data?.results ?? [];

  if (isLoading) return <VaultSkeleton />;

  if (isError) {
    return (
      <ErrorState
        title="Impossible de charger vos documents"
        onRetry={() => refetch()}
      />
    );
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={<PackageCheck />}
        title="Rien à retirer pour le moment"
        description="Quand un acte sera prêt, vous verrez ici où et quand le retirer."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {documents.map((doc) => (
        <Link
          key={doc.id}
          href={paths.app.document.getHref(doc.id)}
          className="group flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft motion-reduce:transform-none"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-success/10">
            <PackageCheck className="size-5 text-success" />
          </div>
          <p className="line-clamp-2 text-sm font-semibold text-foreground">
            {doc.document_type_free || doc.document_type_label}
          </p>
          {doc.pickup?.place_name && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              {doc.pickup.place_name}
            </p>
          )}
          {doc.pickup?.hours && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5 shrink-0" />
              {doc.pickup.hours}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
