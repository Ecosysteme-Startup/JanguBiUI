'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, buttonVariants } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { type Me } from '@/hooks/use-me';
import { ApiError } from '@/lib/api-client';
import { dayjs } from '@/utils/dates';

import { type ProfileInput, useUpdateProfile } from '../api/update-profile';

import { SettingsCard, SettingsRow } from './settings-card';

const schema = z.object({
  title: z.enum(['', 'MR', 'MRS']),
  first_name: z.string().trim().min(1, 'Indiquez votre prénom.').max(50, '50 caractères au plus.'),
  last_name: z.string().trim().min(1, 'Indiquez votre nom.').max(50, '50 caractères au plus.'),
  date_of_birth: z
    .string()
    .refine((v) => v === '' || (dayjs(v).isValid() && dayjs(v).isBefore(dayjs())), 'Date de naissance invalide.'),
  phone: z.string().trim().refine((v) => v === '' || /^\+?[0-9 ]{8,20}$/.test(v), 'Numéro invalide (ex. +221 77 000 00 00).'),
});
type IdentityValues = z.infer<typeof schema>;
const FIELDS = ['title', 'first_name', 'last_name', 'date_of_birth', 'phone'] as const;

const str = (v: unknown) => (typeof v === 'string' ? v : '');

const valuesOf = (me: Me): IdentityValues => {
  const title = str(me.profile.title);
  return {
    title: title === 'MR' || title === 'MRS' ? title : '',
    first_name: str(me.profile.first_name),
    last_name: str(me.profile.last_name),
    date_of_birth: str(me.profile.date_of_birth),
    phone: str(me.profile.phone),
  };
};

export const ACCOUNT_ANCHOR = 'compte';

/**
 * Compte (FID-Profil) : identité modifiable en place (PATCH /me/), barre « modifications non
 * enregistrées ». L'e-mail et le mot de passe restent gérés par l'espace de connexion (Keycloak).
 */
export const IdentitySection = ({ me, accountUrl }: { me: Me; accountUrl: string | null }) => {
  const update = useUpdateProfile({ onSuccess: () => toast.ok('Vos informations sont à jour.') });
  const { register, handleSubmit, setError, reset, formState } = useForm<IdentityValues>({
    resolver: zodResolver(schema),
    defaultValues: valuesOf(me),
  });
  const { errors, dirtyFields } = formState;
  const dirty = Object.keys(dirtyFields).length;

  const onSubmit = handleSubmit((values) => {
    const body: ProfileInput = { ...values, date_of_birth: values.date_of_birth || null, phone: values.phone || null };
    update.mutate(body, {
      onSuccess: () => reset(values),
      onError: (error) => {
        // Erreurs de champ renvoyées par DRF : { phone: ["…"] }
        if (error instanceof ApiError && error.body && typeof error.body === 'object') {
          const fields = error.body as Record<string, unknown>;
          FIELDS.forEach((field) => {
            const messages = fields[field];
            if (Array.isArray(messages) && typeof messages[0] === 'string') setError(field, { message: messages[0] });
          });
        }
      },
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <SettingsCard
        id={ACCOUNT_ANCHOR}
        title="Compte"
        description="Ces informations ne sont visibles que par vous et, pour vos demandes, par le secrétariat concerné."
        footer={
          <>
            <span aria-live="polite" className="flex-1 text-14 text-ink-3">
              {dirty === 0
                ? 'Toutes vos informations sont enregistrées'
                : `${dirty} modification${dirty > 1 ? 's' : ''} non enregistrée${dirty > 1 ? 's' : ''}`}
            </span>
            <Button variant="ghost" className="min-h-11 text-ink" disabled={dirty === 0 || update.isPending} onClick={() => reset(valuesOf(me))}>
              Annuler
            </Button>
            <Button type="submit" className="min-h-11" loading={update.isPending}>
              Enregistrer
            </Button>
          </>
        }
      >
        <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field id="pf-first" label="Prénom" required error={errors.first_name?.message}>
            <Input controlSize="md" autoComplete="given-name" {...register('first_name')} />
          </Field>
          <Field id="pf-last" label="Nom" required error={errors.last_name?.message}>
            <Input controlSize="md" autoComplete="family-name" {...register('last_name')} />
          </Field>
          <Field id="pf-mail" label="E-mail" hint="Il se change sur l’espace de connexion.">
            <Input controlSize="md" type="email" value={me.email} readOnly className="text-ink-2" />
          </Field>
          <Field id="pf-phone" label="Téléphone" optional error={errors.phone?.message}>
            <Input controlSize="md" type="tel" autoComplete="tel" className="tnum" placeholder="+221 77 000 00 00" {...register('phone')} />
          </Field>
          <Field
            id="pf-dob"
            label="Date de naissance"
            hint="Sert uniquement à ouvrir la messagerie aux majeurs."
            error={errors.date_of_birth?.message}
          >
            <Input controlSize="md" type="date" autoComplete="bday" className="tnum" {...register('date_of_birth')} />
          </Field>
          <Field id="pf-title" label="Civilité" optional>
            <Select controlSize="md" {...register('title')}>
              <option value="">Non précisée</option>
              <option value="MRS">Madame</option>
              <option value="MR">Monsieur</option>
            </Select>
          </Field>
        </div>
        {update.isError && !(update.error instanceof ApiError && update.error.status === 400) && (
          <p role="alert" className="m-0 mt-4 text-14 text-err">
            {update.error instanceof ApiError ? update.error.message : 'L’enregistrement a échoué. Réessayez.'}
          </p>
        )}
        <SettingsRow
          title="Mot de passe"
          className="mt-6 border-t border-line pt-5"
          action={
            accountUrl ? (
              <a href={accountUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline' })}>
                Changer le mot de passe
                <Icon name="lien-externe" size={16} />
                <span className="sr-only"> (nouvel onglet)</span>
              </a>
            ) : undefined
          }
        >
          {accountUrl ? 'Géré par l’espace de connexion sécurisé.' : 'L’espace de connexion n’est pas disponible pour le moment.'}
        </SettingsRow>
      </SettingsCard>
    </form>
  );
};
