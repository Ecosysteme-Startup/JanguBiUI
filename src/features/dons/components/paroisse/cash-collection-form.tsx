'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, buttonVariants } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { useBackofficePlaces } from '@/hooks/use-backoffice-places';
import { apiErrorMessage, apiFieldErrors } from '@/utils/api-errors';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { useCreateCashCollection } from '../../api/cash-collections';
import { nomsProposes, useEquipeCompteurs } from '../../api/compteurs';
import { type MassTime, usePlaceMasses } from '../../api/get-place-masses';
import type { StaffFund } from '../../types/schemas';
import { fundKindLabel } from '../../utils/format';

import { panelClasses, Req } from './parts';

const OTHER = '__autre';
/** Messe choisie dans les horaires, sinon le libellé saisi (« Autre messe » ou lieu sans horaires). */
const chosenLabel = (v: { mass_choice: string; mass_other: string }) => (v.mass_choice && v.mass_choice !== OTHER ? v.mass_choice : v.mass_other.trim());
const same = (a: string, b: string) =>
  a.trim().toLocaleLowerCase('fr') === b.trim().toLocaleLowerCase('fr');

const schema = z
  .object({
    mass_date: z.string().min(1, 'Indiquez la date de la messe.'),
    mass_choice: z.string(),
    mass_other: z.string().max(80, '80 caractères au plus.'),
    place_id: z.string(),
    fund_id: z.string().min(1, 'Choisissez le fonds.'),
    amount: z
      .string()
      .refine(
        (v) =>
          /^\d+$/.test(v.replace(/\s/g, '')) &&
          Number(v.replace(/\s/g, '')) > 0,
        'Indiquez le montant compté, en francs.',
      ),
    counter_one: z
      .string()
      .trim()
      .min(1, 'Indiquez le premier compteur.')
      .max(120, '120 caractères au plus.'),
    counter_two: z
      .string()
      .trim()
      .min(1, 'Indiquez le second compteur.')
      .max(120, '120 caractères au plus.'),
    observation: z.string().max(500, '500 caractères au plus.'),
  })
  .superRefine((v, ctx) => {
    if (!v.mass_choice || (v.mass_choice === OTHER && !v.mass_other.trim()))
      ctx.addIssue({
        code: 'custom',
        path: [v.mass_choice === OTHER ? 'mass_other' : 'mass_choice'],
        message: 'Indiquez la messe.',
      });
    if (
      v.counter_one.trim() &&
      v.counter_two.trim() &&
      same(v.counter_one, v.counter_two)
    )
      ctx.addIssue({
        code: 'custom',
        path: ['counter_two'],
        message: 'Deux personnes différentes doivent compter la quête.',
      });
  });
type Values = z.infer<typeof schema>;

const SERVER_FIELDS: Record<string, keyof Values> = {
  mass_date: 'mass_date',
  mass_label: 'mass_choice',
  place_id: 'place_id',
  fund_id: 'fund_id',
  amount: 'amount',
  counter_one: 'counter_one',
  counter_two: 'counter_two',
  observation: 'observation',
};

/** Dimanche le plus récent (aujourd'hui si c'est un dimanche). */
export const lastSunday = () => {
  const today = dayjs();
  return today.subtract(today.day(), 'day').format('YYYY-MM-DD');
};

const hourLabel = (time: string) => {
  const [h, m] = time.split(':');
  return m && m !== '00' ? `${Number(h)}\u00a0h\u00a0${m}` : `${Number(h)}\u00a0h`;
};

/** « Messe de 9 h 30 (étudiants) » : libellé enregistré avec la saisie. */
export const massLabel = (m: MassTime) =>
  `Messe de ${hourLabel(m.start_time)}${m.note ? ` (${m.note})` : ''}`;

/** Messes du jour de la semaine de `date`, valides à cette date. */
const massesOn = (masses: MassTime[], date: string) => {
  if (!date) return [];
  const d = dayjs(date);
  const weekday = (d.day() + 6) % 7;
  return masses
    .filter(
      (m) =>
        m.weekday === weekday &&
        (!m.valid_from || m.valid_from <= date) &&
        (!m.valid_to || m.valid_to >= date),
    )
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
};

const toInt = (v: string) => Number(v.replace(/\s/g, ''));

type Props = { nodeId: string; funds: StaffFund[] };

/** « Nouvelle saisie » (WEB-PAR-Quete-Saisie) : deux compteurs, une autre personne valide. */
export const CashCollectionForm = ({ nodeId, funds }: Props) => {
  const places = useBackofficePlaces(nodeId);
  // Noms de l'équipe des compteurs et noms récents, proposés sans être imposés.
  const noms = nomsProposes(useEquipeCompteurs(nodeId).data);
  const create = useCreateCashCollection(nodeId);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    reset,
    getValues,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      mass_date: lastSunday(),
      mass_choice: '',
      mass_other: '',
      place_id: '',
      fund_id: funds.length === 1 ? funds[0].id : '',
      amount: '',
      counter_one: '',
      counter_two: '',
      observation: '',
    },
  });

  const placeId = watch('place_id');
  const massDate = watch('mass_date');
  const massChoice = watch('mass_choice');

  // Lieu principal par défaut, dès que les lieux sont chargés.
  useEffect(() => {
    const main = places.data?.[0];
    if (main && !getValues('place_id')) setValue('place_id', String(main.id));
  }, [places.data, getValues, setValue]);

  const masses = usePlaceMasses(placeId ? Number(placeId) : null);
  const options = massesOn(masses.data ?? [], massDate);
  const hasSchedule = options.length > 0;

  const onSubmit = handleSubmit((v) => {
    setServerError(null);
    create.mutate(
      {
        node: nodeId,
        fund_id: v.fund_id,
        place_id: v.place_id ? Number(v.place_id) : null,
        mass_date: v.mass_date,
        mass_label: chosenLabel(v),
        amount: toInt(v.amount),
        counter_one: v.counter_one.trim(),
        counter_two: v.counter_two.trim(),
        observation: v.observation.trim(),
      },
      {
        onSuccess: () => {
          toast.ok(
            'Saisie enregistrée. Une autre personne doit maintenant la valider.',
          );
          reset({
            ...getValues(),
            mass_choice: '',
            mass_other: '',
            amount: '',
            counter_one: '',
            counter_two: '',
            observation: '',
          });
        },
        onError: (error) => {
          const fields = apiFieldErrors(error);
          let matched = false;
          Object.entries(fields).forEach(([key, message]) => {
            const field = SERVER_FIELDS[key];
            if (field) {
              setError(
                field === 'mass_choice' && !hasSchedule ? 'mass_other' : field,
                { type: 'server', message },
              );
              matched = true;
            }
          });
          if (!matched) setServerError(apiErrorMessage(error));
        },
      },
    );
  });

  const counterHint = (
    <span className="inline-flex items-center gap-1.5">
      <Icon name="utilisateurs" size={14} className="shrink-0" />
      Deux personnes différentes comptent ensemble, puis signent le bordereau.
    </span>
  );

  return (
    <section
      aria-labelledby="quete-t-form"
      className={cn(panelClasses, 'overflow-hidden')}
    >
      <form noValidate onSubmit={onSubmit}>
        <div className="flex flex-col gap-6 p-6">
          <h2 id="quete-t-form" className="m-0 text-20 font-semibold text-ink">
            Nouvelle saisie
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="quete-date"
              label={<Req>Date de la messe</Req>}
              required
              error={errors.mass_date?.message}
            >
              <Input
                controlSize="sm"
                type="date"
                icon="calendrier"
                className="tnum"
                max={dayjs().format('YYYY-MM-DD')}
                {...register('mass_date')}
              />
            </Field>
            {hasSchedule ? (
              <Field
                id="quete-messe"
                label={<Req>Messe</Req>}
                required
                error={errors.mass_choice?.message}
              >
                <Select controlSize="sm" {...register('mass_choice')}>
                  <option value="">Choisir une messe</option>
                  {options.map((m) => (
                    <option key={m.id} value={massLabel(m)}>
                      {massLabel(m)}
                    </option>
                  ))}
                  <option value={OTHER}>Autre messe…</option>
                </Select>
              </Field>
            ) : (
              <Field
                id="quete-messe-libre"
                label={<Req>Messe</Req>}
                required
                error={
                  errors.mass_other?.message ?? errors.mass_choice?.message
                }
              >
                <Input
                  controlSize="sm"
                  icon="horloge"
                  placeholder="Messe de 10 h"
                  maxLength={80}
                  {...register('mass_other')}
                  onChange={(e) => {
                    setValue('mass_other', e.target.value);
                    setValue('mass_choice', e.target.value ? OTHER : '');
                  }}
                />
              </Field>
            )}
          </div>
          {hasSchedule && massChoice === OTHER && (
            <Field
              id="quete-messe-autre"
              label={<Req>Libellé de la messe</Req>}
              required
              error={errors.mass_other?.message}
            >
              <Input
                controlSize="sm"
                placeholder="Messe de 10 h"
                maxLength={80}
                {...register('mass_other')}
              />
            </Field>
          )}

          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-2 p-0 text-14 font-medium text-ink">
              <Req>Fonds</Req>
              <span className="sr-only"> (obligatoire)</span>
            </legend>
            {funds.length === 0 ? (
              <Notice tone="warn" title="Aucune quête ouverte">
                Ouvrez d’abord le fonds de la quête du dimanche, ou attendez la
                quête impérée publiée par le diocèse.
              </Notice>
            ) : (
              <Controller
                control={control}
                name="fund_id"
                render={({ field }) => (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {funds.map((f) => (
                      <Choice
                        key={f.id}
                        type="radio"
                        variant="card"
                        name={field.name}
                        value={f.id}
                        checked={field.value === f.id}
                        onChange={() => field.onChange(f.id)}
                        label={f.title}
                        description={`${fundKindLabel(f.kind)} · ${f.destination === 'curie' ? 'reversée au diocèse' : 'affectée à la paroisse'}`}
                        className="px-4 py-3.5"
                      />
                    ))}
                  </div>
                )}
              />
            )}
            {errors.fund_id && (
              <p role="alert" className="m-0 flex gap-1.5 text-13 text-err">
                <Icon name="erreur" size={14} className="mt-0.5 shrink-0" />
                {errors.fund_id.message}
              </p>
            )}
          </fieldset>

          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field
              id="quete-lieu"
              label="Lieu"
              error={errors.place_id?.message}
            >
              <Select
                controlSize="sm"
                disabled={!places.data?.length}
                {...register('place_id')}
              >
                {!places.data?.length && (
                  <option value="">
                    {places.isPending
                      ? 'Chargement des lieux…'
                      : 'Aucun lieu enregistré'}
                  </option>
                )}
                {places.data?.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              id="quete-montant"
              label={<Req>Montant compté</Req>}
              required
              hint="Billets et pièces, après double comptage."
              error={errors.amount?.message}
            >
              <Input
                controlSize="sm"
                inputMode="numeric"
                placeholder="0"
                className="tnum"
                trailing={<span className="text-14 text-ink-3">FCFA</span>}
                {...register('amount')}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <Field
                id="quete-compteur-1"
                label={<Req>Premier compteur</Req>}
                required
                error={errors.counter_one?.message}
              >
                <Input
                  controlSize="sm"
                  icon="utilisateurs"
                  placeholder="Nom et prénom"
                  autoComplete="off"
                  list="quete-compteurs-proposes"
                  {...register('counter_one')}
                />
              </Field>
              <Field
                id="quete-compteur-2"
                label={<Req>Second compteur</Req>}
                required
                error={errors.counter_two?.message}
              >
                <Input
                  controlSize="sm"
                  icon="utilisateurs"
                  placeholder="Une autre personne"
                  autoComplete="off"
                  list="quete-compteurs-proposes"
                  {...register('counter_two')}
                />
              </Field>
            </div>
            <p className="m-0 text-13 text-ink-3">{counterHint}</p>
            <datalist id="quete-compteurs-proposes">
              {noms.map((nom) => (
                <option key={nom} value={nom} />
              ))}
            </datalist>
          </div>

          <Field
            id="quete-observation"
            label="Observation"
            optional
            error={errors.observation?.message}
          >
            <Textarea
              controlSize="sm"
              rows={2}
              className="min-h-[76px]"
              maxLength={500}
              {...register('observation')}
            />
          </Field>

          {serverError && (
            <Notice
              tone="err"
              role="alert"
              title="La saisie n’a pas été enregistrée"
            >
              {serverError}
            </Notice>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-surface px-6 py-4">
          <p className="m-0 flex items-center gap-2 text-14 text-ink-2">
            <Icon name="bouclier" size={18} className="shrink-0 text-primary" />
            Une autre personne valide la saisie.
          </p>
          <div className="flex gap-2">
            <NextLink
              href={paths.espace.dons.root.getHref(nodeId)}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'h-11 text-14',
              )}
            >
              Annuler
            </NextLink>
            <Button
              type="submit"
              className="h-11 px-5"
              loading={create.isPending}
              disabled={funds.length === 0}
            >
              Enregistrer la saisie
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
};
