'use client';

import { Calendar, MapPin, Trash2, Users, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { cn } from '@/lib/utils';

import { useDeleteEvent } from '../api/delete-event';
import type { Event } from '../api/get-events';
import { useRegisterEvent } from '../api/register-event';
import { useUnregisterEvent } from '../api/unregister-event';
import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  formatEventDate,
} from '../utils';

interface EventCardProps {
  event: Event;
  canDelete?: boolean;
}

export function EventCard({ event, canDelete = false }: EventCardProps) {
  const { addNotification } = useNotifications();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: register, isPending: registering } = useRegisterEvent();
  const { mutate: unregister, isPending: unregistering } = useUnregisterEvent();
  const { mutate: deleteEvent, isPending: deleting } = useDeleteEvent();

  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const isFull = event.is_full;
  const closed = event.is_cancelled || !event.registrations_open;

  const onError = (err: Error) =>
    addNotification({
      type: 'error',
      title: 'Inscription',
      message: err.message,
    });

  function handleRegistration() {
    if (event.is_registered) {
      unregister(event.id, {
        onSuccess: () =>
          addNotification({
            type: 'success',
            title: 'Désinscrit',
            message: 'Votre inscription a été annulée.',
          }),
        onError,
      });
    } else {
      register(event.id, {
        onSuccess: () =>
          addNotification({
            type: 'success',
            title: 'Inscrit',
            message: 'Votre inscription est confirmée.',
          }),
        onError,
      });
    }
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteEvent(event.id, {
      onSuccess: () =>
        addNotification({
          type: 'success',
          title: 'Supprimé',
          message: "L'événement a été supprimé.",
        }),
    });
  }

  const isPendingAction = registering || unregistering;

  return (
    <Card variant="elevated" className="p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <Link
            href={paths.app.agendaEvent.getHref(event.id)}
            className="font-semibold text-foreground leading-snug transition-colors hover:text-primary focus-visible:outline-none focus-visible:underline"
          >
            <h3>{event.title}</h3>
          </Link>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
              EVENT_TYPE_COLORS[event.event_type] ??
                'bg-muted text-muted-foreground',
            )}
          >
            {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
          </span>
          {canDelete && !confirmDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Supprimer l'événement"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
          {canDelete && confirmDelete && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                isLoading={deleting}
                onClick={handleDelete}
                aria-label={
                  deleting ? 'Suppression en cours' : 'Confirmer la suppression'
                }
                className="px-2 text-[10px]"
              >
                Supprimer
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setConfirmDelete(false)}
                aria-label="Annuler la suppression"
                className="text-muted-foreground hover:bg-muted"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {event.description && (
        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
          {event.description}
        </p>
      )}

      <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3.5 shrink-0" />
          <span className="capitalize">{formatEventDate(start, end)}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" />
            <span>{event.location}</span>
          </div>
        )}
        {event.max_participants != null && (
          <div className="flex items-center gap-1.5">
            <Users className="size-3.5 shrink-0" />
            <span>
              {event.seats_taken} / {event.max_participants} places réservées
              {isFull && (
                <span className="ml-1 text-destructive font-medium">
                  · Complet
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleRegistration}
        disabled={
          isPendingAction || ((isFull || closed) && !event.is_registered)
        }
        className={cn(
          'flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 motion-reduce:transition-none',
          event.is_registered
            ? 'bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive'
            : 'bg-primary text-primary-foreground hover:bg-primary/90',
        )}
      >
        {isPendingAction && <Spinner className="size-4" />}
        {event.is_registered
          ? 'Annuler mon inscription'
          : event.is_cancelled
            ? 'Événement annulé'
            : isFull
              ? 'Complet'
              : closed
                ? 'Inscriptions closes'
                : "S'inscrire"}
      </button>
    </Card>
  );
}
