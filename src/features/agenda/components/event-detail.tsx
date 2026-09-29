'use client';

import { ArrowLeft, Calendar, Church, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { useNotifications } from '@/components/ui/notifications';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { cn } from '@/lib/utils';

import { useEvent } from '../api/get-event';
import type { Event } from '../api/get-events';
import { useRegisterEvent } from '../api/register-event';
import { useUnregisterEvent } from '../api/unregister-event';
import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  formatEventDate,
} from '../utils';

interface EventDetailProps {
  eventId: number;
}

function EventDetailSkeleton() {
  return (
    <ContentContainer width="reading">
      <Skeleton className="mb-4 h-4 w-24" />
      <Card variant="elevated" className="space-y-4 p-5">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </Card>
    </ContentContainer>
  );
}

export function EventDetail({ eventId }: EventDetailProps) {
  const { data: event, isLoading, isError } = useEvent(eventId);

  useRegisterPageMeta({
    title: event?.title ?? 'Événement',
    leafLabel: event?.title,
    showHeading: false,
  });

  if (isLoading) return <EventDetailSkeleton />;

  if (isError || !event) {
    return (
      <ContentContainer width="reading">
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Événement introuvable.
          </p>
          <Button variant="link" size="sm" asChild>
            <Link href={paths.app.agenda.getHref()}>
              Retour à l&apos;agenda
            </Link>
          </Button>
        </div>
      </ContentContainer>
    );
  }

  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const isFull = event.is_full;
  return (
    <ContentContainer width="reading">
      <Link
        href={paths.app.agenda.getHref()}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Agenda
      </Link>

      <Card variant="elevated" className="p-5 md:p-6">
        <span
          className={cn(
            'mb-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            EVENT_TYPE_COLORS[event.event_type] ??
              'bg-muted text-muted-foreground',
          )}
        >
          {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
        </span>

        <h1 className="mb-4 text-2xl font-bold leading-tight text-foreground">
          {event.title}
        </h1>

        <div className="mb-5 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0" />
            <span className="capitalize">{formatEventDate(start, end)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
          {event.node_name && (
            <div className="flex items-center gap-2">
              <Church className="size-4 shrink-0" />
              <span>{event.node_name}</span>
            </div>
          )}
          {event.max_participants != null && (
            <div className="flex items-center gap-2">
              <Users className="size-4 shrink-0" />
              <span>
                {event.seats_taken} / {event.max_participants} places réservées
                {isFull && (
                  <span className="ml-1 font-medium text-destructive">
                    · Complet
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {event.description ? (
          <p className="mb-6 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-foreground/90">
            {event.description}
          </p>
        ) : (
          <p className="mb-6 text-sm italic text-muted-foreground">
            Aucune description pour cet événement.
          </p>
        )}

        <RegistrationBox event={event} />
      </Card>
    </ContentContainer>
  );
}

const MAX_SEATS = 10;

/** Messages des refus d'inscription (codes V1 de apps/agenda). */
const REGISTRATION_ERRORS: Record<string, string> = {
  event_full: 'Cet événement est complet.',
  not_enough_seats:
    'Il ne reste pas assez de places pour ce nombre de personnes.',
  registrations_closed: 'Les inscriptions sont closes.',
  event_cancelled: 'Cet événement a été annulé.',
  event_past: 'Cet événement est terminé.',
  invalid_seats: `Indiquez entre 1 et ${MAX_SEATS} personnes.`,
};

function RegistrationBox({ event }: { event: Event }) {
  const { addNotification } = useNotifications();
  const [seats, setSeats] = useState(event.my_seats ?? 1);
  const [error, setError] = useState<string | null>(null);
  const { mutate: register, isPending: registering } = useRegisterEvent();
  const { mutate: unregister, isPending: unregistering } = useUnregisterEvent();
  const isPendingAction = registering || unregistering;

  if (event.is_cancelled) {
    return (
      <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Cet événement a été annulé.
      </p>
    );
  }

  const maxSeats = Math.max(
    1,
    Math.min(
      MAX_SEATS,
      (event.seats_remaining ?? MAX_SEATS) + (event.my_seats ?? 0),
    ),
  );
  const canRegister =
    event.registrations_open && (!event.is_full || event.is_registered);

  const onError = (err: unknown) => {
    const code = (err as { code?: string | null })?.code ?? '';
    setError(
      REGISTRATION_ERRORS[code] ??
        'L’inscription n’a pas pu aboutir. Réessayez dans quelques instants.',
    );
  };

  function handleRegister() {
    setError(null);
    register(
      { eventId: event.id, seats },
      {
        onSuccess: () =>
          addNotification({
            type: 'success',
            title: 'Inscription enregistrée',
            message:
              seats > 1
                ? `${seats} places sont réservées.`
                : 'Votre place est réservée.',
          }),
        onError,
      },
    );
  }

  function handleUnregister() {
    setError(null);
    unregister(event.id, {
      onSuccess: () =>
        addNotification({
          type: 'success',
          title: 'Inscription annulée',
          message: 'Votre inscription a été annulée.',
        }),
      onError,
    });
  }

  return (
    <div className="space-y-3">
      {event.is_registered && (
        <p className="text-sm text-foreground">
          Vous êtes inscrit
          {event.my_seats && event.my_seats > 1
            ? ` pour ${event.my_seats} personnes`
            : ''}
          .
        </p>
      )}
      {!event.registrations_open && !event.is_registered && (
        <p className="text-sm text-muted-foreground">
          Les inscriptions sont closes.
        </p>
      )}
      {canRegister && (
        <label className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          Nombre de personnes
          <select
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground"
            aria-label="Nombre de personnes"
          >
            {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        {canRegister &&
          (!event.is_registered || seats !== (event.my_seats ?? 1)) && (
            <button
              type="button"
              onClick={handleRegister}
              disabled={isPendingAction}
              className={cn(
                'flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50',
              )}
            >
              {registering && <Spinner className="size-4" />}
              {event.is_registered ? 'Modifier mon inscription' : "S'inscrire"}
            </button>
          )}
        {event.is_registered && (
          <button
            type="button"
            onClick={handleUnregister}
            disabled={isPendingAction}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-muted py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            {unregistering && <Spinner className="size-4" />}
            Annuler mon inscription
          </button>
        )}
        {!canRegister && !event.is_registered && event.is_full && (
          <p className="text-sm font-medium text-destructive">Complet</p>
        )}
      </div>
    </div>
  );
}
