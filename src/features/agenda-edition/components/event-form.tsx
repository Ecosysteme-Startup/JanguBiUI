'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Place } from '@/hooks/use-backoffice-places';
import { apiErrorMessage, apiFieldErrors } from '@/utils/api-errors';
import { dayjs } from '@/utils/dates';

import { EVENT_TYPE_LABELS, EVENT_TYPES, type StaffEvent, useSaveEvent } from '../api/staff-events';

const schema = z
  .object({
    title: z.string().trim().min(1, 'Le titre est obligatoire.').max(200, '200 caractères au plus.'),
    event_type: z.enum(EVENT_TYPES),
    start_date: z.string().min(1, 'Indiquez la date de début.'),
    start_time: z.string().min(1, 'Indiquez l’heure de début.'),
    end_date: z.string().min(1, 'Indiquez la date de fin.'),
    end_time: z.string().min(1, 'Indiquez l’heure de fin.'),
    location: z.string().max(300, '300 caractères au plus.'),
    place_id: z.string(),
    max_participants: z.string().refine((v) => v === '' || (Number.isInteger(Number(v)) && Number(v) >= 1), 'Un nombre entier, au moins 1.'),
    description: z.string(),
  })
  .superRefine((v, ctx) => {
    if (!v.start_date || !v.start_time || !v.end_date || !v.end_time) return;
    if (!dayjs(`${v.end_date}T${v.end_time}`).isAfter(dayjs(`${v.start_date}T${v.start_time}`)))
      ctx.addIssue({ code: 'custom', path: ['end_time'], message: 'La fin doit suivre le début.' });
  });
type Values = z.infer<typeof schema>;

const SERVER_FIELDS: Record<string, keyof Values> = {
  title: 'title',
  start_at: 'start_time',
  end_at: 'end_time',
  location: 'location',
  max_participants: 'max_participants',
};

const defaultsOf = (event: StaffEvent | null, day: string | null): Values => {
  const start = event ? dayjs(event.start_at) : null;
  const end = event ? dayjs(event.end_at) : null;
  const date = day ?? '';
  return {
    title: event?.title ?? '',
    event_type: event?.event_type ?? 'other',
    start_date: start?.format('YYYY-MM-DD') ?? date,
    start_time: start?.format('HH:mm') ?? '',
    end_date: end?.format('YYYY-MM-DD') ?? date,
    end_time: end?.format('HH:mm') ?? '',
    location: event?.location ?? '',
    place_id: event?.place_id ? String(event.place_id) : '',
    max_participants: event?.max_participants ? String(event.max_participants) : '',
    description: event?.description ?? '',
  };
};

/** Date et heure locales → ISO avec décalage (« 2026-10-10T08:30:00+00:00 »). */
const isoOf = (date: string, time: string) => dayjs(`${date}T${time}`).format();

type EventFormProps = {
  nodeId: string;
  event: StaffEvent | null;
  day: string | null;
  places: Place[];
  onClose: () => void;
  onSaved: (event: StaffEvent) => void;
};

/** Création ou modification d'un événement (modale de l'agenda). */
export const EventForm = ({ nodeId, event, day, places, onClose, onSaved }: EventFormProps) => {
  const save = useSaveEvent({ onSuccess: onSaved });
  const { register, handleSubmit, setError, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaultsOf(event, day) });

  const onSubmit = handleSubmit(async (v) => {
    const common = {
      title: v.title.trim(),
      description: v.description.trim(),
      event_type: v.event_type,
      start_at: isoOf(v.start_date, v.start_time),
      end_at: isoOf(v.end_date, v.end_time),
      location: v.location.trim(),
      max_participants: v.max_participants ? Number(v.max_participants) : null,
    };
    try {
      await save.mutateAsync(
        event ? { id: event.id, body: common } : { id: null, body: { ...common, node_id: nodeId, place_id: v.place_id ? Number(v.place_id) : null } },
      );
    } catch (error) {
      Object.entries(apiFieldErrors(error)).forEach(([field, message]) => {
        const target = SERVER_FIELDS[field];
        if (target) setError(target, { message });
      });
    }
  });

  const e = formState.errors;
  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={event ? 'Modifier l’événement' : 'Nouvel événement'}
      description="Les événements publiés apparaissent dans « Ma paroisse » pour les fidèles qui suivent la paroisse."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="ag-form" disabled={save.isPending}>
            {save.isPending ? 'Enregistrement…' : event ? 'Enregistrer' : 'Créer l’événement'}
          </Button>
        </>
      }
    >
      <form id="ag-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Field id="ag-titre-champ" label="Titre" required error={e.title?.message}>
          <Input {...register('title')} />
        </Field>
        <Field id="ag-type" label="Type d’événement">
          <Select {...register('event_type')}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field id="ag-debut-date" label="Début, date" required error={e.start_date?.message} className="sm:col-span-2">
            <Input type="date" {...register('start_date')} />
          </Field>
          <Field id="ag-debut-heure" label="Début, heure" required error={e.start_time?.message} className="sm:col-span-2">
            <Input type="time" {...register('start_time')} />
          </Field>
          <Field id="ag-fin-date" label="Fin, date" required error={e.end_date?.message} className="sm:col-span-2">
            <Input type="date" {...register('end_date')} />
          </Field>
          <Field id="ag-fin-heure" label="Fin, heure" required error={e.end_time?.message} className="sm:col-span-2">
            <Input type="time" {...register('end_time')} />
          </Field>
        </div>
        <Field id="ag-lieu" label="Lieu" hint="Salle paroissiale, cour, adresse…" error={e.location?.message}>
          <Input {...register('location')} />
        </Field>
        {!event && places.length > 0 && (
          <Field id="ag-lieu-culte" label="Lieu de culte concerné">
            <Select {...register('place_id')}>
              <option value="">Toute la paroisse</option>
              {places.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field id="ag-places" label="Places disponibles" hint="Vide : sans inscription limitée." error={e.max_participants?.message}>
          <Input type="number" min={1} inputMode="numeric" {...register('max_participants')} className="w-40" />
        </Field>
        <Field id="ag-description" label="Description">
          <Textarea rows={4} {...register('description')} />
        </Field>
        {save.isError && (
          <p role="alert" className="m-0 text-sm text-err">
            {apiErrorMessage(save.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
