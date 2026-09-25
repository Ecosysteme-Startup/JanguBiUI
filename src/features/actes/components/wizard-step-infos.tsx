'use client';

import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils/cn';

import type { RequestOptions } from '../api/get-request-options';
import { MONTHS, sacramentOf, type WizardValues } from '../utils/wizard-schema';

import { AttachmentPicker } from './attachment-picker';

type Followed = { id: string; name: string } | null;

type Props = {
  options: RequestOptions;
  file: File | null;
  onFileChange: (file: File | null) => void;
  followed: Followed;
  onEdit: () => void;
};

const SectionTitle = ({ id, n, title, aside }: { id: string; n: string; title: string; aside?: React.ReactNode }) => (
  <div className="tnum mb-5 flex items-baseline justify-between gap-4 border-t border-line-strong pt-3 text-meta text-ink-2">
    <h3 id={id} className="m-0 text-meta font-normal">
      <span className="text-primary">{n}</span> — {title}
    </h3>
    {aside && <span className="text-ink-3">{aside}</span>}
  </div>
);

/** Étape 3 : identité, sacrement et motif, pièce facultative, retrait de l'original, consentement. */
export const WizardStepInfos = ({ options, file, onFileChange, followed, onEdit }: Props) => {
  const { register, watch, formState } = useFormContext<WizardValues>();
  const errors = formState.errors;
  const [type, parish, reason] = watch(['document_type', 'parish', 'reason']);
  const typeOption = options.document_types.find((t) => t.value === type);
  const allowed = typeOption?.allowed_reasons ?? options.reasons.map((r) => r.value);
  const reasons = options.reasons.filter((r) => allowed.includes(r.value));
  const sacrament = sacramentOf(type);
  const parishName = parish?.name ?? 'la paroisse du sacrement';
  const canTransfer = followed !== null && followed.id !== parish?.id;

  return (
    <div className="flex flex-col gap-10">
      {/* Rappel des étapes 1 et 2 (mobile : la colonne latérale est masquée). */}
      <div className="flex items-start justify-between gap-4 rounded border border-line bg-surface px-4 py-3 lg:hidden">
        <div>
          <p className="m-0 text-base font-semibold text-ink">{typeOption?.label}</p>
          <p className="m-0 mt-0.5 text-sm text-ink-2">{parish?.name}</p>
        </div>
        <Button variant="tertiary" size="sm" onClick={onEdit}>
          Modifier
        </Button>
      </div>

      <section aria-labelledby="dn-identite">
        <SectionTitle
          id="dn-identite"
          n="01"
          title="Identité au moment du sacrement"
          aside={
            <>
              <span className="text-err">*</span> champ obligatoire
            </>
          }
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="dn-nom" label="Nom de famille" required error={errors.last_name?.message}>
            <Input {...register('last_name')} autoComplete="family-name" />
          </Field>
          <Field id="dn-prenoms" label="Prénoms" required error={errors.first_names?.message} hint="Tous les prénoms, dans l’ordre où ils figurent au registre.">
            <Input {...register('first_names')} autoComplete="given-name" />
          </Field>
          <Field id="dn-naissance" label="Date de naissance" required error={errors.date_of_birth?.message}>
            <Input {...register('date_of_birth')} placeholder="JJ/MM/AAAA" inputMode="numeric" autoComplete="bday" />
          </Field>
          <Field id="dn-lieu" label="Lieu de naissance" required error={errors.place_of_birth?.message}>
            <Input {...register('place_of_birth')} />
          </Field>
          <Field id="dn-pere" label="Nom et prénoms du père" required error={errors.father?.message}>
            <Input {...register('father')} />
          </Field>
          <Field id="dn-mere" label="Nom de jeune fille de la mère" required error={errors.mother?.message}>
            <Input {...register('mother')} />
          </Field>
          <Field id="dn-tel" label="Téléphone" required error={errors.contact_phone?.message} hint="Le secrétariat vous appelle s’il manque une précision.">
            <Input {...register('contact_phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="+221 77 000 00 00" />
          </Field>
          <Field id="dn-mail" label="Adresse électronique" required error={errors.contact_email?.message}>
            <Input {...register('contact_email')} type="email" autoComplete="email" />
          </Field>
        </div>
      </section>

      <section aria-labelledby="dn-sacrement">
        <SectionTitle id="dn-sacrement" n="02" title={`${sacrament.title} et le motif`} aside="Date approximative acceptée" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="dn-mois" label={`Mois ${sacrament.noun}`} hint="Facultatif.">
            <Select {...register('sacrament_month')}>
              <option value="">Je ne sais pas</option>
              {MONTHS.map((month, index) => (
                <option key={month} value={String(index + 1).padStart(2, '0')}>
                  {month}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="dn-annee" label={`Année ${sacrament.noun}`} required error={errors.sacrament_year?.message}>
            <Input {...register('sacrament_year')} inputMode="numeric" maxLength={4} placeholder="AAAA" />
          </Field>
          {type === 'religious_marriage' && (
            <>
              <Field id="dn-epoux" label="Nom et prénoms de l’époux" required error={errors.spouse_groom?.message}>
                <Input {...register('spouse_groom')} />
              </Field>
              <Field id="dn-epouse" label="Nom et prénoms de l’épouse" required error={errors.spouse_bride?.message}>
                <Input {...register('spouse_bride')} />
              </Field>
            </>
          )}
          {type === 'godparent' && (
            <Field id="dn-celebration" label="Célébration où vous avez été parrain ou marraine" required error={errors.celebration_type?.message} className="sm:col-span-2">
              <Input {...register('celebration_type')} placeholder="Baptême, confirmation…" />
            </Field>
          )}
        </div>
        <fieldset className="m-0 mt-6 border-0 p-0" aria-describedby={errors.reason ? 'dn-motif-err' : undefined}>
          <legend className="p-0 text-sm font-semibold text-ink">
            Motif de la demande <span className="text-err" aria-hidden="true">*</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
            {reasons.map((r) => (
              <Choice key={r.value} type="radio" value={r.value} label={r.label} {...register('reason')} />
            ))}
          </div>
          {errors.reason && (
            <p id="dn-motif-err" role="alert" className="m-0 mt-2 flex items-center gap-2 text-sm text-err">
              <Icon name="alerte" size={16} />
              {errors.reason.message}
            </p>
          )}
        </fieldset>
        {reason === 'other' && (
          <Field id="dn-motif-libre" label="Précisez le motif" required error={errors.reason_free?.message} className="mt-5">
            <Input {...register('reason_free')} maxLength={255} />
          </Field>
        )}
        <Field id="dn-infos" label="Précisions utiles au secrétariat" hint="Facultatif : nom du parrain, date prévue du mariage…" className="mt-5">
          <Textarea {...register('additional_info')} rows={3} />
        </Field>
      </section>

      <div className="grid gap-10 sm:grid-cols-2 sm:gap-6">
        <section aria-labelledby="dn-piece">
          <SectionTitle id="dn-piece" n="03" title="Pièce justificative" aside="Facultatif" />
          <AttachmentPicker id="dn-fichier" file={file} onChange={onFileChange} />
        </section>
        <section aria-labelledby="dn-retrait">
          <SectionTitle id="dn-retrait" n="04" title="Retrait de l’original" />
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="sr-only">Mode de retrait de l’original</legend>
            <PickupOption value="secretariat" title="Au secrétariat de la paroisse du sacrement" detail={`${parishName} · le plus rapide`} />
            {canTransfer && followed && (
              <PickupOption
                value="transfer_to_followed_parish"
                title={`Transmission à ma paroisse, ${followed.name}`}
                detail="Quelques jours de plus"
              />
            )}
          </fieldset>
        </section>
      </div>

      <div className="border-t border-line pt-6">
        <Choice
          {...register('consent')}
          aria-invalid={errors.consent ? true : undefined}
          aria-describedby={errors.consent ? 'dn-consent-err' : undefined}
          label={`J’atteste l’exactitude de ces informations et j’accepte qu’elles soient transmises au secrétariat de ${parishName}, pour le seul traitement de cette demande.`}
        />
        {errors.consent && (
          <p id="dn-consent-err" role="alert" className="m-0 ml-8 mt-2 flex items-center gap-2 text-sm text-err">
            <Icon name="alerte" size={16} />
            {errors.consent.message}
          </p>
        )}
      </div>
    </div>
  );
};

const PickupOption = ({ value, title, detail }: { value: string; title: string; detail: string }) => {
  const { register, watch } = useFormContext<WizardValues>();
  const checked = watch('pickup_mode') === value;
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded border px-4 py-3',
        checked ? 'border-primary bg-tint-50' : 'border-line bg-surface hover:border-ink',
      )}
    >
      <input type="radio" value={value} {...register('pickup_mode')} className="mt-0.5 size-5 shrink-0" />
      <span>
        <span className="block text-base font-semibold text-ink">{title}</span>
        <span className="block text-sm text-ink-2">{detail}</span>
      </span>
    </label>
  );
};
