'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { ApiError } from '@/lib/api-client';
import { dayjs } from '@/utils/dates';

import { useEventRegistration } from '../api/get-event';
import type { ParishEvent } from '../api/get-events';

const Capacity = ({ event }: { event: ParishEvent }) => {
  if (event.max_participants === null) {
    return <p className="m-0 mt-3 text-base text-ink-2">Inscription libre, sans limite de places.</p>;
  }
  const left = Math.max(0, event.max_participants - event.registrations_count);
  const ratio = Math.min(100, Math.round((event.registrations_count / event.max_participants) * 100));
  return (
    <>
      <p className="m-0 mt-3 text-base text-ink">
        <span className="tnum font-serif text-h3">{left}</span> place{left > 1 ? 's' : ''} restante{left > 1 ? 's' : ''} sur{' '}
        {event.max_participants}
      </p>
      <div role="img" aria-label={`${event.registrations_count} places réservées sur ${event.max_participants}`} className="mt-3 h-1 bg-line">
        <div className="h-1 bg-primary" style={{ width: `${ratio}%` }} />
      </div>
    </>
  );
};

/** Inscription à un événement : l'API ne prend qu'une inscription par personne, sans détail. */
export const EventRegistration = ({ event }: { event: ParishEvent }) => {
  const registration = useEventRegistration(String(event.id));
  const ended = dayjs(event.end_at).isBefore(dayjs());
  const error = registration.error instanceof ApiError ? registration.error.message : registration.error ? 'L’inscription n’a pas pu être enregistrée.' : null;

  let body: ReactNode;
  if (event.is_cancelled) {
    body = (
      <Notice tone="warn" title="Événement annulé">
        La paroisse a annulé cet événement. Les inscrits ont été prévenus.
      </Notice>
    );
  } else if (ended) {
    body = <p className="m-0 mt-4 text-base text-ink-2">Cet événement est terminé.</p>;
  } else if (event.is_registered) {
    body = (
      <>
        <div role="status" className="mt-4">
          <Notice tone="ok" title="Inscription enregistrée">
            Un rappel vous arrivera la veille, dans vos notifications.
          </Notice>
        </div>
        <Button variant="tertiary" className="mt-3" disabled={registration.isPending} onClick={() => registration.mutate(false)}>
          Me désinscrire
        </Button>
      </>
    );
  } else {
    body = (
      <Button block className="mt-5" disabled={event.is_full || registration.isPending} onClick={() => registration.mutate(true)}>
        {event.is_full ? 'Complet' : registration.isPending ? 'Inscription…' : 'M’inscrire'}
      </Button>
    );
  }

  return (
    <section aria-labelledby="ev-inscr" className="border border-line bg-surface p-6">
      <p id="ev-inscr" className="m-0 font-serif text-h4 text-ink">
        Mon inscription
      </p>
      <Capacity event={event} />
      <div aria-live="polite">{body}</div>
      {error && (
        <p role="alert" className="m-0 mt-3 text-sm text-err">
          {error}
        </p>
      )}
    </section>
  );
};
