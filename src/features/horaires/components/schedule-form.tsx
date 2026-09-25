'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import type { Place } from '@/hooks/use-backoffice-places';
import { apiErrorMessage } from '@/utils/api-errors';
import { cn } from '@/utils/cn';

import type { Schedule, Weekday } from '../api/get-place-schedule';
import { toItem, useReplacePlaceSchedule } from '../api/replace-place-schedule';
import { findOverlap, KIND_LABELS, minutesOf, type ScheduleKind, WEEKDAYS } from '../utils/schedule';

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

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="tnum m-0 text-meta text-ink-3">Horaire récurrent · * obligatoire</p>
          <h2 id="h-form-titre" className="m-0 mt-1 font-serif text-h3 font-normal text-ink">
            Nouvel horaire
          </h2>
        </div>
        <button type="button" aria-label="Fermer le panneau" onClick={onClose} className="hit inline-flex size-10 items-center justify-center rounded hover:bg-surface-2">
          <Icon name="x" size={20} />
        </button>
      </div>

      <Field id="h-lieu" label="Lieu de culte" required error={formState.errors.place_id?.message}>
        <Select {...register('place_id')}>
          {places.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}
            </option>
          ))}
        </Select>
      </Field>

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2 text-sm font-semibold text-ink">
          Célébration <span className="text-err" aria-hidden="true">*</span>
        </legend>
        <div className="flex flex-wrap gap-x-5">
          {(Object.keys(KIND_LABELS) as ScheduleKind[]).map((kind) => (
            <label key={kind} className="flex h-11 cursor-pointer items-center gap-2 text-base text-ink">
              <input type="radio" value={kind} {...register('kind')} className="size-5" /> {KIND_LABELS[kind]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="m-0 border-0 p-0" aria-describedby="h-jours-aide">
        <legend className="mb-2 text-sm font-semibold text-ink">
          Jours <span className="text-err" aria-hidden="true">*</span>
        </legend>
        <Controller
          control={control}
          name="weekdays"
          render={({ field }) => (
            <div className="flex gap-1.5">
              {DAY_LETTERS.map((letter, weekday) => {
                const pressed = field.value.includes(weekday);
                return (
                  <button
                    key={weekday}
                    type="button"
                    aria-pressed={pressed}
                    aria-label={WEEKDAYS[weekday]}
                    onClick={() => field.onChange(pressed ? field.value.filter((d) => d !== weekday) : [...field.value, weekday])}
                    className={cn(
                      'hit inline-flex size-10 items-center justify-center rounded border text-sm font-medium transition-colors',
                      pressed ? 'border-ink bg-ink text-paper' : 'border-line text-ink hover:border-ink',
                    )}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          )}
        />
        <p id="h-jours-aide" className="m-0 mt-2 text-sm text-ink-3">
          {recurrenceHint(days)}
        </p>
        {formState.errors.weekdays && (
          <p role="alert" className="m-0 mt-1 flex items-center gap-2 text-sm text-err">
            <Icon name="alerte" size={16} /> {formState.errors.weekdays.message}
          </p>
        )}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field id="h-debut" label="Début" required error={formState.errors.start?.message}>
          <Input type="time" {...register('start')} />
        </Field>
        <Field id="h-fin" label="Fin" error={formState.errors.end?.message}>
          <Input type="time" {...register('end')} />
        </Field>
      </div>

      <Field id="h-note" label="Précision" hint="Affichée sous l’heure : « Étudiants », « en wolof »…" error={formState.errors.note?.message}>
        <Input {...register('note')} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field id="h-du" label="À partir du">
          <Input type="date" {...register('valid_from')} />
        </Field>
        <Field id="h-au" label="Jusqu’au" error={formState.errors.valid_to?.message}>
          <Input type="date" {...register('valid_to')} />
        </Field>
      </div>

      {replace.isError && (
        <p role="alert" className="m-0 text-sm text-err">
          {apiErrorMessage(replace.error)}
        </p>
      )}
      <div className="flex justify-end gap-3 border-t border-line pt-4">
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" disabled={replace.isPending}>
          {replace.isPending ? 'Enregistrement…' : 'Ajouter l’horaire'}
        </Button>
      </div>
    </form>
  );
};
