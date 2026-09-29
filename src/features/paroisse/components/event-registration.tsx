'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { Progress } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api-client';
import { dayjs, hour } from '@/utils/dates';
import { plural } from '@/utils/plural';

import { useEventRegistration } from '../api/get-event';
import type { ParishEvent } from '../api/get-events';

/** Bornes du serveur (`RegisterInput`) : 1 à 10 personnes, remarque de 300 caractères. */
export const MAX_SEATS = 10;
export const NOTE_MAX = 300;

const Capacity = ({ event }: { event: ParishEvent }) => {
  if (event.max_participants === null) {
    return <p className="m-0 mt-2 text-14 text-ink-2">Inscription libre, sans limite de places.</p>;
  }
  const left = event.seats_remaining ?? 0;
  return (
    <>
      <p className="tnum m-0 mt-2 text-14 text-ink-2">
        <span className="text-20 font-semibold text-ink">{left}</span> place{left > 1 ? 's' : ''} restante{left > 1 ? 's' : ''} sur{' '}
        {event.max_participants}
      </p>
      <Progress
        value={event.seats_taken}
        max={event.max_participants}
        label={`${plural(event.seats_taken, 'place réservée', 'places réservées')} sur ${event.max_participants}`}
        className="mt-3"
      />
    </>
  );
};

/** « Clôture le 5 octobre à 18 h » */
const closingLabel = (iso: string) => `Clôture le ${dayjs(iso).format('D MMMM')} à ${hour(iso)}`;

/** Places que je peux demander : ma réservation actuelle comprise, dans la limite du serveur. */
const maxSeatsFor = (event: ParishEvent) =>
  event.seats_remaining === null ? MAX_SEATS : Math.max(1, Math.min(MAX_SEATS, event.seats_remaining + (event.my_seats ?? 0)));

const formSchema = (max: number) =>
  z.object({
    seats: z
      .number({ message: 'Indiquez un nombre.' })
      .int('Indiquez un nombre entier.')
      .min(1, 'Au moins une personne.')
      .max(max, max === 1 ? 'Il ne reste qu’une place.' : `${max} personnes au plus.`),
    note: z.string().max(NOTE_MAX, `${NOTE_MAX} caractères au plus.`),
  });
type FormValues = { seats: number; note: string };

const RegistrationForm = ({ event, onDone }: { event: ParishEvent; onDone?: () => void }) => {
  const registration = useEventRegistration(String(event.id));
  const max = maxSeatsFor(event);
  const { register, handleSubmit, formState, watch } = useForm<FormValues>({
    resolver: zodResolver(formSchema(max)),
    defaultValues: { seats: event.my_seats ?? 1, note: event.my_note ?? '' },
  });
  const note = watch('note');
  const error = registration.error instanceof ApiError ? registration.error.message : registration.error ? 'L’inscription n’a pas pu être enregistrée.' : null;

  return (
    <form
      noValidate
      className="mt-5 flex flex-col gap-4"
      onSubmit={handleSubmit((values) =>
        registration.mutate({ seats: values.seats, note: values.note.trim() }, { onSuccess: () => onDone?.() }),
      )}
    >
      <Field id="ev-personnes" label="Personnes" required hint={`Vous compris · ${max} au plus`} error={formState.errors.seats?.message}>
        <Input type="number" inputMode="numeric" controlSize="md" min={1} max={max} {...register('seats', { valueAsNumber: true })} className="w-28" />
      </Field>
      <Field
        id="ev-remarque"
        label="Remarque (facultatif)"
        hint="Lue par les organisateurs uniquement."
        error={formState.errors.note?.message}
        counter={{ value: note.length, max: NOTE_MAX }}
      >
        <Textarea rows={3} controlSize="md" {...register('note')} />
      </Field>
      <Button type="submit" block disabled={registration.isPending}>
        {registration.isPending ? 'Enregistrement…' : event.is_registered ? 'Mettre à jour' : 'M’inscrire'}
      </Button>
      {error && (
        <p role="alert" className="m-0 text-14 text-err">
          {error}
        </p>
      )}
    </form>
  );
};

const Registered = ({ event }: { event: ParishEvent }) => {
  const registration = useEventRegistration(String(event.id));
  const [editing, setEditing] = useState(false);
  const seats = event.my_seats ?? 1;
  return (
    <>
      <div role="status" className="mt-4">
        <Notice tone="ok" title="Inscription enregistrée">
          {seats} personne{seats > 1 ? 's' : ''}. Un rappel vous arrivera la veille, dans vos notifications.
        </Notice>
      </div>
      {event.registrations_open && (editing ? <RegistrationForm event={event} onDone={() => setEditing(false)} /> : null)}
      <div className="mt-3 flex flex-wrap gap-3">
        {event.registrations_open && !editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            Modifier mon inscription
          </Button>
        )}
        <Button variant="ghost" disabled={registration.isPending} onClick={() => registration.mutate(null)}>
          Me désinscrire
        </Button>
      </div>
    </>
  );
};

/** Inscription à un événement (FID-Evenement) : nombre de personnes, remarque, clôture. */
export const EventRegistration = ({ event }: { event: ParishEvent }) => {
  const ended = dayjs(event.end_at).isBefore(dayjs());

  let body: ReactNode;
  if (event.is_cancelled) {
    body = (
      <Notice tone="warn" title="Événement annulé">
        La paroisse a annulé cet événement. Les inscrits ont été prévenus.
      </Notice>
    );
  } else if (ended) {
    body = <p className="m-0 mt-4 text-14 text-ink-2">Cet événement est terminé.</p>;
  } else if (event.is_registered) {
    body = <Registered event={event} />;
  } else if (!event.registrations_open) {
    body = <p className="m-0 mt-4 text-14 text-ink-2">Les inscriptions sont closes.</p>;
  } else if (event.is_full) {
    body = (
      <Button block className="mt-5" disabled>
        Complet
      </Button>
    );
  } else {
    body = <RegistrationForm event={event} />;
  }

  return (
    <Card as="section" aria-labelledby="ev-inscr">
      <h2 id="ev-inscr" className="m-0 text-18 font-semibold text-ink">
        Mon inscription
      </h2>
      {event.registration_closes_at && !event.is_cancelled && (
        <p className="tnum m-0 mt-1 text-13 text-ink-3">{closingLabel(event.registration_closes_at)}</p>
      )}
      <Capacity event={event} />
      <div aria-live="polite">{body}</div>
    </Card>
  );
};
