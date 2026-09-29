'use client';

import { ArrowRight, CalendarDays } from 'lucide-react';
import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';
import { useEvents } from '@/features/agenda/api/get-events';
import { EventCard } from '@/features/agenda/components/event-card';

export function ParishEventsSection() {
  // Le fil agenda ne renvoie que les événements à venir, triés par date.
  const { data, isLoading } = useEvents({ limit: 3 });
  const upcomingEvents = data?.results ?? [];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">
          <CalendarDays className="size-3.5" />
          Événements à venir
        </h2>
        <Link
          href="/app/agenda"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Agenda
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && upcomingEvents.length === 0 && (
        <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          Aucun événement prévu prochainement.
        </p>
      )}

      {!isLoading &&
        upcomingEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
    </section>
  );
}
