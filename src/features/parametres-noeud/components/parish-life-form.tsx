'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type * as React from 'react';
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
import { type TypeDelays, type TypeDelaysUpdate, useUpdateTypeDelays } from '../api/type-delays';

type TypeDelaysUpdateItem = TypeDelaysUpdate['items'][number];

import { SettingsCard } from './section-title';
import { TypeDelayFields } from './type-delay-fields';

const OFFICE_HOURS_MAX = 7;
const ACTS_DELAY_MAX = 90;
const WELCOME_MAX = 1000;
const PHONE_PATTERN = /^\+?[0-9 ().-]{6,30}$/;

const delayDays = z
  .string()
  .trim()
  .refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= ACTS_DELAY_MAX), `Entre 1 et ${ACTS_DELAY_MAX} jours.`);

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
  acts_delay_days: delayDays,
  /** Délai propre à chaque type d'acte (vide : délai de la paroisse). Enregistré à part (documents). */
  type_delays: z.array(z.object({ document_type: z.string(), label: z.string(), days: delayDays })),
  acts_welcome_message: z.string().trim().max(WELCOME_MAX, `${WELCOME_MAX} caractères au plus.`),
});
type Values = z.infer<typeof schema>;

const toValues = (s: ParishLife, delays: TypeDelays): Values => ({
  phone: s.phone,
  email: s.email,
  address: s.address,
  city: s.city,
  office_hours: s.office_hours,
  secretariat_public: s.secretariat_public,
  acts_delay_days: s.acts_delay_days === null ? '' : String(s.acts_delay_days),
  acts_welcome_message: s.acts_welcome_message,
  type_delays: delays.items.map((i) => ({ document_type: i.document_type, label: i.document_type_label, days: i.days === null ? '' : String(i.days) })),
});

const toBody = ({ type_delays: _typeDelays, ...v }: Values): ParishLifeUpdate => ({
  ...v,
  acts_delay_days: v.acts_delay_days === '' ? null : Number(v.acts_delay_days),
});

export type ParishLifeValues = Values;

const toDelaysBody = (v: Values) => ({
  items: v.type_delays.map((d) => ({ document_type: d.document_type as TypeDelayType, days: d.days === '' ? null : Number(d.days) })),
});
type TypeDelayType = TypeDelaysUpdateItem['document_type'];

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
export const ParishLifeForm = ({
  nodeId,
  settings,
  typeDelays,
  canEdit,
  identity,
  aside,
}: {
  nodeId: string;
  settings: ParishLife;
  typeDelays: TypeDelays;
  canEdit: boolean;
  /** Carte affichée avant « Secrétariat » (colonne de gauche). */
  identity?: React.ReactNode;
  /** Cartes affichées après « Délais de traitement » (colonne de droite). */
  aside?: React.ReactNode;
}) => {
  const [saved, setSaved] = useState(false);
  const { register, control, handleSubmit, reset, setError, watch, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(settings, typeDelays),
  });
  const hours = useFieldArray({ control, name: 'office_hours' });
  const update = useUpdateParishLife(nodeId);
  const updateDelays = useUpdateTypeDelays(nodeId);
  const { type_delays: dirtyDelays, ...dirtySettings } = formState.dirtyFields;
  const dirtyDelayCount = (dirtyDelays ?? []).filter((row) => row?.days).length;
  const dirtyCount = Object.keys(dirtySettings).length + dirtyDelayCount;
  const errors = formState.errors;
  const disabled = !canEdit;
  const saveError = update.isError ? update.error : updateDelays.isError ? updateDelays.error : null;

  const onSubmit = handleSubmit(async (values) => {
    setSaved(false);
    try {
      // Deux ressources : les paramètres du nœud, puis les délais par type d'acte (documents).
      const nextSettings = Object.keys(dirtySettings).length > 0 ? await update.mutateAsync(toBody(values)) : settings;
      const nextDelays = dirtyDelayCount > 0 ? await updateDelays.mutateAsync(toDelaysBody(values)) : typeDelays;
      reset(toValues(nextSettings, nextDelays));
      setSaved(true);
    } catch (error) {
      Object.entries(apiFieldErrors(error)).forEach(([field, message]) => {
        if (field in values) setError(field as keyof Values, { message });
      });
    }
  });

  const footer = (
    <>
      <span className="tnum flex items-center gap-2 text-13 text-ink-3" aria-live="polite">
        {saved && dirtyCount === 0 && <span className="font-medium text-ok">Paramètres enregistrés.</span>}
        {dirtyCount > 0 ? (
          <>
            <span aria-hidden="true" className="size-1.5 rounded-full bg-warn-dot" />
            <span className="text-warn">{`${dirtyCount} modification${dirtyCount > 1 ? 's' : ''}`}</span>
          </>
        ) : (
          <span>Aucune modification</span>
        )}
      </span>
      {canEdit && (
        <span className="flex gap-2">
          <Button variant="outline" className="text-14" disabled={dirtyCount === 0} onClick={() => reset()}>
            Annuler
          </Button>
          <Button type="submit" disabled={dirtyCount === 0 || update.isPending || updateDelays.isPending}>
            {update.isPending || updateDelays.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </span>
      )}
    </>
  );

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Paramètres du secrétariat" className="grid items-start gap-6 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-6">
        {identity}
        <SettingsCard
          id="p-sec"
          title="Secrétariat"
          description={watch('secretariat_public') ? 'Coordonnées visibles sur la fiche publique.' : 'Coordonnées non publiées.'}
        >
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="p-tel" label="Téléphone" error={errors.phone?.message}>
                <Input type="tel" autoComplete="off" icon="telephone" controlSize="sm" className="text-15" {...register('phone')} disabled={disabled} />
              </Field>
              <Field id="p-mail" label="Adresse e-mail" error={errors.email?.message}>
                <Input type="email" autoComplete="off" icon="mail" controlSize="sm" className="text-15" {...register('email')} disabled={disabled} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_176px]">
              <Field id="p-adr" label="Adresse" hint="Utilisée pour l’itinéraire des fidèles." error={errors.address?.message}>
                <Input icon="pin" controlSize="sm" className="text-15" {...register('address')} disabled={disabled} />
              </Field>
              <Field id="p-ville" label="Ville" error={errors.city?.message}>
                <Input controlSize="sm" className="text-15" {...register('city')} disabled={disabled} />
              </Field>
            </div>

            <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
              <legend className="mb-2 p-0 text-14 font-medium text-ink">Horaires d&apos;accueil</legend>
              {hours.fields.length === 0 && <p className="m-0 text-14 text-ink-3">Aucun créneau d&apos;accueil renseigné.</p>}
              {hours.fields.map((slot, index) => (
                <div key={slot.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_40px] items-end gap-3">
                  <Field id={`p-jours-${index}`} label={`Jours, créneau ${index + 1}`} error={errors.office_hours?.[index]?.days?.message}>
                    <Input placeholder="Lun. – ven." controlSize="sm" className="text-15" {...register(`office_hours.${index}.days`)} disabled={disabled} />
                  </Field>
                  <Field id={`p-heures-${index}`} label={`Heures, créneau ${index + 1}`} error={errors.office_hours?.[index]?.hours?.message}>
                    <Input placeholder="9 h-12 h · 15 h 30-18 h" controlSize="sm" className="text-15" {...register(`office_hours.${index}.hours`)} disabled={disabled} />
                  </Field>
                  {canEdit && <IconButton icon="corbeille" label={`Retirer le créneau ${index + 1}`} onClick={() => hours.remove(index)} className="mb-0.5" />}
                </div>
              ))}
              {canEdit && hours.fields.length < OFFICE_HOURS_MAX && (
                <Button variant="ghost" size="sm" className="-ml-2 self-start" onClick={() => hours.append({ days: '', hours: '' })}>
                  Ajouter un créneau
                </Button>
              )}
            </fieldset>

            <div className="border-t border-line pt-4">
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
          </div>
        </SettingsCard>
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <SettingsCard id="p-actes" title="Délais de traitement" description="Annoncés aux fidèles au moment de la demande d’acte.">
          <div className="flex flex-col gap-4">
            <Field
              id="p-delai"
              label="Délai indicatif, tous actes"
              hint="Jours ouvrés. Vide : le délai du diocèse s’applique."
              error={errors.acts_delay_days?.message}
              className="grid grid-cols-[minmax(0,1fr)_64px] items-center gap-x-4 border-b border-line pb-4 [&>p]:col-span-2"
            >
              <Input inputMode="numeric" controlSize="sm" className="tnum text-center text-15" {...register('acts_delay_days')} disabled={disabled} />
            </Field>
            <TypeDelayFields rows={watch('type_delays')} register={register} errors={errors} fallback={watch('acts_delay_days') || String(typeDelays.default_days)} disabled={disabled} />
            <Field
              id="p-accueil"
              label="Message d’accueil des demandes"
              hint="Montré au fidèle qui demande un acte (pièces à apporter, retrait de l’original…)."
              counter={{ value: watch('acts_welcome_message').length, max: WELCOME_MAX }}
              error={errors.acts_welcome_message?.message}
            >
              <Textarea rows={4} className="text-15" {...register('acts_welcome_message')} disabled={disabled} />
            </Field>
          </div>
        </SettingsCard>
        {aside}
      </div>

      <div className="lg:col-span-2">
        {saveError !== null && (
          <p role="alert" className="m-0 mb-2 rounded-12 bg-err-bg px-4 py-2 text-14 text-err">
            {saveErrorMessage(saveError)}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-16 border border-line bg-surface px-6 py-3">{footer}</div>
      </div>
    </form>
  );
};
