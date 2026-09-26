'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { apiErrorCode, apiErrorMessage, apiFieldErrors, isForbidden } from '@/utils/api-errors';

import { type ParishLife, type ParishLifeUpdate, useUpdateParishLife } from '../api/node-settings';

import { SectionTitle } from './section-title';

const OFFICE_HOURS_MAX = 7;
const ACTS_DELAY_MAX = 90;
const WELCOME_MAX = 1000;
const PHONE_PATTERN = /^\+?[0-9 ().-]{6,30}$/;

const schema = z.object({
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || PHONE_PATTERN.test(v), 'Numéro invalide : chiffres, espaces et « + » seulement.'),
  email: z
    .string()
    .trim()
    .refine((v) => v === '' || z.string().email().safeParse(v).success, 'Adresse e-mail invalide.'),
  address: z.string().trim().max(300, '300 caractères au plus.'),
  city: z.string().trim().max(100, '100 caractères au plus.'),
  office_hours: z
    .array(
      z.object({
        days: z.string().trim().min(1, 'Indiquez les jours.').max(40, '40 caractères au plus.'),
        hours: z.string().trim().min(1, 'Indiquez les heures.').max(120, '120 caractères au plus.'),
      }),
    )
    .max(OFFICE_HOURS_MAX),
  secretariat_public: z.boolean(),
  acts_delay_days: z
    .string()
    .trim()
    .refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= ACTS_DELAY_MAX), `Entre 1 et ${ACTS_DELAY_MAX} jours.`),
  acts_welcome_message: z.string().trim().max(WELCOME_MAX, `${WELCOME_MAX} caractères au plus.`),
});
type Values = z.infer<typeof schema>;

const toValues = (s: ParishLife): Values => ({
  phone: s.phone,
  email: s.email,
  address: s.address,
  city: s.city,
  office_hours: s.office_hours,
  secretariat_public: s.secretariat_public,
  acts_delay_days: s.acts_delay_days === null ? '' : String(s.acts_delay_days),
  acts_welcome_message: s.acts_welcome_message,
});

const toBody = (v: Values): ParishLifeUpdate => ({
  ...v,
  acts_delay_days: v.acts_delay_days === '' ? null : Number(v.acts_delay_days),
});

const saveErrorMessage = (error: unknown) =>
  apiErrorCode(error) === 'mfa_required'
    ? 'Validez d’abord votre double authentification, puis recommencez.'
    : isForbidden(error)
      ? 'Vous n’avez pas la capacité de modifier ces paramètres.'
      : apiErrorMessage(error);

/**
 * Sections « 02 — Secrétariat » et « 05 — Demandes d’actes » de PAR-Parametres : le secrétariat
 * les modifie avec `horaires.gerer`. Sans capacité, lecture seule.
 */
export const ParishLifeForm = ({ nodeId, settings, canEdit }: { nodeId: string; settings: ParishLife; canEdit: boolean }) => {
  const [saved, setSaved] = useState(false);
  const { register, control, handleSubmit, reset, setError, watch, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(settings),
  });
  const hours = useFieldArray({ control, name: 'office_hours' });
  const update = useUpdateParishLife(nodeId, {
    onSuccess: (updated) => {
      reset(toValues(updated));
      setSaved(true);
    },
  });
  const dirtyCount = Object.keys(formState.dirtyFields).length;
  const errors = formState.errors;
  const disabled = !canEdit;

  const onSubmit = handleSubmit(async (values) => {
    setSaved(false);
    try {
      await update.mutateAsync(toBody(values));
    } catch (error) {
      Object.entries(apiFieldErrors(error)).forEach(([field, message]) => {
        if (field in values) setError(field as keyof Values, { message });
      });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Paramètres du secrétariat" className="flex flex-col gap-10">
      <section aria-labelledby="p-sec">
        <SectionTitle id="p-sec" number="02" aside={watch('secretariat_public') ? 'Visible sur la fiche publique' : 'Non publié'}>
          Secrétariat
        </SectionTitle>
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="p-tel" label="Téléphone" error={errors.phone?.message}>
              <Input type="tel" autoComplete="off" {...register('phone')} disabled={disabled} />
            </Field>
            <Field id="p-mail" label="Adresse e-mail" error={errors.email?.message}>
              <Input type="email" autoComplete="off" {...register('email')} disabled={disabled} />
            </Field>
          </div>
          <Field id="p-adr" label="Adresse" error={errors.address?.message}>
            <Input {...register('address')} disabled={disabled} />
          </Field>
          <Field id="p-ville" label="Ville" error={errors.city?.message}>
            <Input {...register('city')} disabled={disabled} />
          </Field>

          <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
            <legend className="mb-2 text-sm font-semibold text-ink">Horaires d&apos;accueil</legend>
            {hours.fields.length === 0 && <p className="m-0 text-sm text-ink-3">Aucun créneau d&apos;accueil renseigné.</p>}
            {hours.fields.map((slot, index) => (
              <div key={slot.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_40px] items-end gap-3">
                <Field id={`p-jours-${index}`} label={`Jours, créneau ${index + 1}`} error={errors.office_hours?.[index]?.days?.message}>
                  <Input placeholder="Lun. – ven." {...register(`office_hours.${index}.days`)} disabled={disabled} />
                </Field>
                <Field id={`p-heures-${index}`} label={`Heures, créneau ${index + 1}`} error={errors.office_hours?.[index]?.hours?.message}>
                  <Input placeholder="9 h-12 h · 15 h 30-18 h" {...register(`office_hours.${index}.hours`)} disabled={disabled} />
                </Field>
                {canEdit && <IconButton icon="corbeille" label={`Retirer le créneau ${index + 1}`} onClick={() => hours.remove(index)} />}
              </div>
            ))}
            {canEdit && hours.fields.length < OFFICE_HOURS_MAX && (
              <Button variant="secondary" size="sm" className="self-start" onClick={() => hours.append({ days: '', hours: '' })}>
                Ajouter un créneau
              </Button>
            )}
          </fieldset>

          <Controller
            control={control}
            name="secretariat_public"
            render={({ field }) => (
              <Switch
                id="p-public"
                label="Publier sur la fiche publique"
                description="Téléphone, e-mail et heures d’accueil, visibles de tous dans l’annuaire."
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            )}
          />
        </div>
      </section>

      <section aria-labelledby="p-actes">
        <SectionTitle id="p-actes" number="05" aside="Affiché au fidèle">
          Demandes d&apos;actes
        </SectionTitle>
        <div className="mt-4 flex flex-col gap-4">
          <Field
            id="p-delai"
            label="Délai indicatif de traitement (jours ouvrés)"
            hint="Laissez vide pour ne pas afficher de délai."
            error={errors.acts_delay_days?.message}
            className="max-w-xs"
          >
            <Input inputMode="numeric" {...register('acts_delay_days')} disabled={disabled} />
          </Field>
          <Field
            id="p-accueil"
            label="Message d’accueil des demandes"
            hint="Montré au fidèle qui demande un acte (pièces à apporter, retrait de l’original…)."
            counter={{ value: watch('acts_welcome_message').length, max: WELCOME_MAX }}
            error={errors.acts_welcome_message?.message}
          >
            <Textarea rows={4} {...register('acts_welcome_message')} disabled={disabled} />
          </Field>
        </div>
      </section>

      <div>
        <p className="m-0 min-h-5 text-sm" aria-live="polite">
          {saved && <span className="text-ok">Paramètres enregistrés.</span>}
        </p>
        {update.isError && (
          <p role="alert" className="m-0 mt-2 text-sm text-err">
            {saveErrorMessage(update.error)}
          </p>
        )}
        {canEdit && (
          <div className="mt-2 flex flex-wrap items-center justify-end gap-3">
            <span className="tnum text-meta text-ink-3">
              {dirtyCount > 0 ? `${dirtyCount} modification${dirtyCount > 1 ? 's' : ''}` : 'Aucune modification'}
            </span>
            <Button variant="secondary" disabled={dirtyCount === 0} onClick={() => reset()}>
              Annuler
            </Button>
            <Button type="submit" disabled={dirtyCount === 0 || update.isPending}>
              {update.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
};
