'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { apiErrorMessage } from '@/utils/api-error-details';

import { type RuleCreateBody, useCreateRule } from '../api/rules';
import type { Place } from '../api/schemas';

export const WEEKDAYS = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
] as const;
const DURATIONS = [10, 15, 20, 30] as const;

const minutesOf = (value: string) => {
  const [h = '0', m = '0'] = value.split(':');
  return Number(h) * 60 + Number(m);
};

const schema = z
  .object({
    place_id: z.coerce
      .number({ invalid_type_error: 'Choisissez le lieu.' })
      .int()
      .positive('Choisissez le lieu.'),
    weekday: z.coerce.number().int().min(0).max(6),
    start_time: z.string().min(1, 'Indiquez l’heure de début.'),
    end_time: z.string().min(1, 'Indiquez l’heure de fin.'),
    slot_minutes: z.coerce.number().int().min(5).max(60),
    valid_from: z.string().optional(),
    valid_to: z.string().optional(),
  })
  .refine(
    (v) =>
      !v.start_time ||
      !v.end_time ||
      minutesOf(v.end_time) > minutesOf(v.start_time),
    {
      path: ['end_time'],
      message: 'La fin doit suivre le début.',
    },
  )
  .refine((v) => !v.valid_from || !v.valid_to || v.valid_to >= v.valid_from, {
    path: ['valid_to'],
    message: 'La période se termine avant de commencer.',
  });
type RuleInput = z.input<typeof schema>;
type RuleOutput = z.output<typeof schema>;

/** Nouveaux créneaux récurrents (PAR-Confessions, panneau) : pour le prêtre connecté. */
export const RuleForm = ({
  places,
  onDone,
}: {
  places: Place[];
  onDone: () => void;
}) => {
  const create = useCreateRule();
  const main = places.find((p) => p.is_main) ?? places[0];
  const { register, handleSubmit, watch, formState } = useForm<
    RuleInput,
    unknown,
    RuleOutput
  >({
    resolver: zodResolver(schema),
    defaultValues: {
      place_id: main?.id ?? 0,
      weekday: 5,
      start_time: '16:00',
      end_time: '18:00',
      slot_minutes: 10,
      valid_from: '',
      valid_to: '',
    },
  });
  const errors = formState.errors;
  const [start, end, minutes] = watch([
    'start_time',
    'end_time',
    'slot_minutes',
  ]);
  const perWeek =
    start && end
      ? Math.max(
          0,
          Math.floor(
            (minutesOf(end) - minutesOf(start)) / Number(minutes || 10),
          ),
        )
      : 0;

  const submit = handleSubmit((values) => {
    const body: RuleCreateBody = {
      place_id: values.place_id,
      weekday: values.weekday,
      start_time: values.start_time,
      end_time: values.end_time,
      slot_minutes: values.slot_minutes,
      valid_from: values.valid_from || null,
      valid_to: values.valid_to || null,
    };
    create.mutate(body, {
      onSuccess: () => {
        toast.ok('Créneaux créés pour les quatre prochaines semaines.');
        onDone();
      },
    });
  });

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <Field
        id="regle-lieu"
        label="Lieu"
        required
        error={errors.place_id?.message}
        className="sm:col-span-2"
      >
        <Select {...register('place_id')}>
          {places.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="regle-jour" label="Récurrence" required>
        <Select {...register('weekday')}>
          {WEEKDAYS.map((d, i) => (
            <option key={d} value={i}>
              Chaque {d}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="regle-duree" label="Durée d’un créneau">
        <Select {...register('slot_minutes')}>
          {DURATIONS.map((d) => (
            <option key={d} value={d}>
              {d} minutes
            </option>
          ))}
        </Select>
      </Field>
      <Field
        id="regle-debut"
        label="De"
        required
        error={errors.start_time?.message}
      >
        <Input type="time" {...register('start_time')} />
      </Field>
      <Field id="regle-fin" label="À" required error={errors.end_time?.message}>
        <Input type="time" {...register('end_time')} />
      </Field>
      <Field
        id="regle-du"
        label="Valable du"
        hint="Facultatif : dès aujourd’hui"
      >
        <Input type="date" {...register('valid_from')} />
      </Field>
      <Field
        id="regle-au"
        label="Jusqu’au"
        hint="Facultatif : sans fin"
        error={errors.valid_to?.message}
      >
        <Input type="date" {...register('valid_to')} />
      </Field>
      <p
        className="tnum m-0 text-sm text-ink-2 sm:col-span-2"
        aria-live="polite"
      >
        {perWeek > 0
          ? `${perWeek} créneau${perWeek > 1 ? 'x' : ''} par semaine, générés sur quatre semaines glissantes.`
          : 'Aucun créneau avec ces horaires.'}
      </p>
      {create.isError && (
        <Notice
          tone="err"
          title="Les créneaux n’ont pas été créés"
          className="sm:col-span-2"
        >
          {apiErrorMessage(create.error)}
        </Notice>
      )}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button variant="secondary" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" disabled={create.isPending || perWeek === 0}>
          Créer les créneaux
        </Button>
      </div>
    </form>
  );
};
