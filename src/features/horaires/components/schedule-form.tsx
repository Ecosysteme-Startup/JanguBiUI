'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import type { Place } from '@/hooks/use-backoffice-places';
import { apiErrorMessage } from '@/utils/api-errors';
import { cn } from '@/utils/cn';

import type { Schedule, Weekday } from '../api/get-place-schedule';
import { toItem, useReplacePlaceSchedule } from '../api/replace-place-schedule';
import { findOverlap, KIND_LABELS, minutesOf, type ScheduleKind, WEEKDAYS, WEEKDAYS_SHORT } from '../utils/schedule';

const schema = z
  .object({
    place_id: z.string().min(1, 'Choisissez le lieu de culte.'),
    kind: z.enum(['messe', 'confession', 'adoration']),
    weekdays: z.array(z.number()).min(1, 'Choisissez au moins un jour.'),
    start: z.string().min(1, 'Indiquez l’heure de début.'),
    end: z.string(),
    note: z.string().max(120, '120 caractères au plus.'),
    valid_from: z.string(),
    valid_to: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.start && v.end && minutesOf(v.end) <= minutesOf(v.start)) ctx.addIssue({ code: 'custom', path: ['end'], message: 'La fin doit suivre le début.' });
    if (v.valid_from && v.valid_to && v.valid_to < v.valid_from)
      ctx.addIssue({ code: 'custom', path: ['valid_to'], message: 'La date de fin doit suivre la date de début.' });
  });
type Values = z.infer<typeof schema>;

const Required = () => (
  <span aria-hidden="true" className="text-err">
    {' '}
    *
  </span>
);

const recurrenceHint = (days: number[]) => {
  if (days.length === 0) return 'Aucun jour choisi.';
  if (days.length === 7) return 'Tous les jours, hors exceptions.';
  const names = [...days].sort().map((d) => WEEKDAYS[d].toLowerCase());
  return `Chaque ${names.join(', ')}, hors exceptions.`;
};

type ScheduleFormProps = {
  places: Place[];
  schedulesByPlace: Record<number, Schedule[]>;
  onClose: () => void;
};

/** Panneau « Nouvel horaire » (PAR-Horaires) : horaire récurrent sur un ou plusieurs jours. */
export const ScheduleForm = ({ places, schedulesByPlace, onClose }: ScheduleFormProps) => {
  const replace = useReplacePlaceSchedule();
  const { register, control, handleSubmit, watch, setError, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { place_id: places[0] ? String(places[0].id) : '', kind: 'messe', weekdays: [], start: '', end: '', note: '', valid_from: '', valid_to: '' },
  });
  const days = watch('weekdays');

  const onSubmit = handleSubmit(async (values) => {
    const placeId = Number(values.place_id);
    const existing = schedulesByPlace[placeId] ?? [];
    for (const weekday of values.weekdays) {
      const clash = findOverlap({ weekday, start_time: values.start, end_time: values.end || null }, existing);
      if (clash) {
        setError(clash.field, { message: clash.message });
        return;
      }
    }
    const added = values.weekdays.map((weekday) => ({
      kind: values.kind,
      weekday: weekday as Weekday,
      start_time: values.start,
      end_time: values.end || null,
      note: values.note.trim(),
      valid_from: values.valid_from || null,
      valid_to: values.valid_to || null,
    }));
    try {
      await replace.mutateAsync({ placeId, items: [...existing.map(toItem), ...added] });
      toast.ok(added.length > 1 ? `${added.length} horaires ajoutés.` : 'Horaire ajouté.');
      onClose();
    } catch {
      // Message affiché par l'état de la mutation.
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 pb-1">
      <div className="flex flex-col gap-2">
        <span className="text-14 font-medium text-ink">Type</span>
        <Controller
          control={control}
          name="kind"
          render={({ field }) => (
            <SegmentedControl
              label="Type"
              value={field.value}
              onChange={field.onChange}
              size="sm"
              block
              options={(Object.keys(KIND_LABELS) as ScheduleKind[]).map((k) => [k, KIND_LABELS[k]] as const)}
            />
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_300px]">
        <Field id="h-note" label="Intitulé" optional hint="Sous l’heure : « Messe des étudiants »…" error={formState.errors.note?.message}>
          <Input {...register('note')} controlSize="sm" className="text-15" />
        </Field>
        <Field id="h-lieu" label={<>Lieu de culte<Required /></>} required error={formState.errors.place_id?.message}>
          <Select {...register('place_id')} controlSize="sm" className="text-15">
            {places.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <fieldset className="m-0 border-0 p-0" aria-describedby="h-jours-aide">
        <legend className="mb-2 p-0 text-14 font-medium text-ink">
          Jours
          <Required />
        </legend>
        <Controller
          control={control}
          name="weekdays"
          render={({ field }) => (
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
              {WEEKDAYS_SHORT.map((short, weekday) => {
                const pressed = field.value.includes(weekday);
                return (
                  <button
                    key={weekday}
                    type="button"
                    aria-pressed={pressed}
                    aria-label={WEEKDAYS[weekday]}
                    onClick={() => field.onChange(pressed ? field.value.filter((d) => d !== weekday) : [...field.value, weekday])}
                    className={cn(
                      'hit inline-flex h-10 items-center justify-center rounded-10 text-14 transition-colors',
                      pressed ? 'border-2 border-primary bg-tint-50 font-semibold text-tint-800' : 'border border-line bg-paper font-medium text-ink hover:border-line-field',
                    )}
                  >
                    {short}
                  </button>
                );
              })}
            </div>
          )}
        />
        {formState.errors.weekdays && (
          <p role="alert" className="m-0 mt-2 flex gap-1.5 text-13 text-err">
            <Icon name="erreur" size={14} className="mt-0.5 shrink-0" /> {formState.errors.weekdays.message}
          </p>
        )}
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <Field id="h-debut" label={<>Début<Required /></>} required error={formState.errors.start?.message}>
          <Input type="time" {...register('start')} controlSize="sm" className="tnum text-15" />
        </Field>
        <Field id="h-fin" label="Fin" optional error={formState.errors.end?.message}>
          <Input type="time" {...register('end')} controlSize="sm" className="tnum text-15" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field id="h-du" label="À partir du" optional>
          <Input type="date" {...register('valid_from')} controlSize="sm" className="tnum text-15" />
        </Field>
        <Field id="h-au" label="Jusqu’au" optional error={formState.errors.valid_to?.message}>
          <Input type="date" {...register('valid_to')} controlSize="sm" className="tnum text-15" />
        </Field>
      </div>

      {replace.isError && (
        <p role="alert" className="m-0 text-14 text-err">
          {apiErrorMessage(replace.error)}
        </p>
      )}
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p id="h-jours-aide" className="m-0 text-13 text-ink-3">
          {recurrenceHint(days)}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="min-h-11 text-14" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" className="min-h-11 px-5" disabled={replace.isPending}>
            {replace.isPending ? 'Enregistrement…' : 'Ajouter l’horaire'}
          </Button>
        </div>
      </div>
    </form>
  );
};
