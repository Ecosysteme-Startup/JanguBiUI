'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import type { Place } from '@/hooks/use-backoffice-places';
import { apiErrorMessage } from '@/utils/api-errors';
import { dayjs } from '@/utils/dates';

import { useCreatePlaceException } from '../api/place-exceptions';
import { KIND_LABELS, minutesOf, type ScheduleKind } from '../utils/schedule';

const schema = z
  .object({
    place_id: z.string().min(1, 'Choisissez le lieu de culte.'),
    date: z.string().min(1, 'Indiquez la date.'),
    mode: z.enum(['annulation', 'supplementaire']),
    kind: z.enum(['messe', 'confession', 'adoration']),
    start: z.string(),
    end: z.string(),
    note: z.string().max(200, '200 caractères au plus.'),
  })
  .superRefine((v, ctx) => {
    if (v.date && dayjs(v.date).isBefore(dayjs(), 'day')) ctx.addIssue({ code: 'custom', path: ['date'], message: 'La date est déjà passée.' });
    if (v.mode === 'supplementaire' && !v.start)
      ctx.addIssue({ code: 'custom', path: ['start'], message: 'Un horaire supplémentaire doit avoir une heure de début.' });
    if (v.start && v.end && minutesOf(v.end) <= minutesOf(v.start)) ctx.addIssue({ code: 'custom', path: ['end'], message: 'La fin doit suivre le début.' });
  });
type Values = z.infer<typeof schema>;

/** Panneau « Nouvelle exception » : annulation ponctuelle ou horaire supplémentaire. */
export const ExceptionForm = ({ places, onClose }: { places: Place[]; onClose: () => void }) => {
  const create = useCreatePlaceException({
    onSuccess: () => {
      toast.ok('Exception enregistrée : elle est annoncée aux fidèles.');
      onClose();
    },
  });
  const { register, handleSubmit, watch, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { place_id: places[0] ? String(places[0].id) : '', date: '', mode: 'annulation', kind: 'messe', start: '', end: '', note: '' },
  });
  const mode = watch('mode');

  const onSubmit = handleSubmit((v) =>
    create.mutate({
      placeId: Number(v.place_id),
      body: {
        date: v.date,
        kind: v.kind,
        cancelled: v.mode === 'annulation',
        start_time: v.start || null,
        end_time: v.end || null,
        note: v.note.trim(),
      },
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="tnum m-0 text-meta text-ink-3">Exception ponctuelle · * obligatoire</p>
          <h2 id="h-form-titre" className="m-0 mt-1 font-serif text-h3 font-normal text-ink">
            Nouvelle exception
          </h2>
        </div>
        <button type="button" aria-label="Fermer le panneau" onClick={onClose} className="hit inline-flex size-10 items-center justify-center rounded hover:bg-surface-2">
          <Icon name="x" size={20} />
        </button>
      </div>

      <Field id="e-lieu" label="Lieu de culte" required error={formState.errors.place_id?.message}>
        <Select {...register('place_id')}>
          {places.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="e-date" label="Date" required error={formState.errors.date?.message}>
        <Input type="date" {...register('date')} />
      </Field>
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2 text-sm font-semibold text-ink">Nature</legend>
        <label className="flex h-11 cursor-pointer items-center gap-2 text-base text-ink">
          <input type="radio" value="annulation" {...register('mode')} className="size-5" /> Annulation
        </label>
        <label className="flex h-11 cursor-pointer items-center gap-2 text-base text-ink">
          <input type="radio" value="supplementaire" {...register('mode')} className="size-5" /> Horaire supplémentaire
        </label>
      </fieldset>
      <Field id="e-type" label="Célébration">
        <Select {...register('kind')}>
          {(Object.keys(KIND_LABELS) as ScheduleKind[]).map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field
          id="e-debut"
          label={mode === 'annulation' ? 'Heure annulée' : 'Début'}
          required={mode === 'supplementaire'}
          hint={mode === 'annulation' ? 'Vide : toute la journée.' : undefined}
          error={formState.errors.start?.message}
        >
          <Input type="time" {...register('start')} />
        </Field>
        <Field id="e-fin" label="Fin" error={formState.errors.end?.message}>
          <Input type="time" {...register('end')} />
        </Field>
      </div>
      <Field id="e-note" label="Motif" hint="Montré aux fidèles : « récollection du clergé »…" error={formState.errors.note?.message}>
        <Input {...register('note')} />
      </Field>

      {create.isError && (
        <p role="alert" className="m-0 text-sm text-err">
          {apiErrorMessage(create.error)}
        </p>
      )}
      <div className="flex justify-end gap-3 border-t border-line pt-4">
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Enregistrement…' : 'Ajouter l’exception'}
        </Button>
      </div>
    </form>
  );
};
