'use client';

import { useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInfiniteEvents } from '@/features/agenda/api/get-events';
import { EventCard } from '@/features/agenda/components/event-card';
import { cn } from '@/lib/utils';

const EVENT_TYPE_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'mass', label: 'Messes' },
  { value: 'conference', label: 'Conférences' },
  { value: 'retreat', label: 'Retraites' },
  { value: 'ordination', label: 'Ordinations' },
  { value: 'other', label: 'Autres' },
];

export default function AgendaPage() {
  const [selectedType, setSelectedType] = useState('');
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteEvents(selectedType ? { type: selectedType } : {});
  const events = data?.pages.flatMap((p) => p.results) ?? [];

  useRegisterPageMeta({
    title: 'Agenda',
    subtitle: 'Événements et célébrations de votre paroisse',
  });

  return (
    <div className="flex flex-col">
      <ContentContainer>
        <div className="mb-6 flex flex-wrap gap-2">
          {EVENT_TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setSelectedType(filter.value)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                selectedType === filter.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} variant="elevated" className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </Card>
            ))}
          </div>
        )}

        {isError && (
          <p
            role="alert"
            className="py-16 text-center text-sm text-muted-foreground"
          >
            L’agenda n’a pas pu être chargé. Réessayez dans quelques instants.
          </p>
        )}

        {!isLoading && !isError && events.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Aucun événement à venir.
            </p>
          </div>
        )}

        {events.length > 0 && (
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
            {hasNextPage && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void fetchNextPage()}
                isLoading={isFetchingNextPage}
              >
                Voir plus d’événements
              </Button>
            )}
          </div>
        )}
      </ContentContainer>
    </div>
  );
}
