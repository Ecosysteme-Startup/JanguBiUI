'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { type Me } from '@/hooks/use-me';
import { ApiError } from '@/lib/api-client';
import { dayjs } from '@/utils/dates';

import { type ProfileInput, useUpdateProfile } from '../api/update-profile';

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

const TITLE_LABEL = { MR: 'M.', MRS: 'Mme', '': '' } as const;

const IdentityForm = ({ me, onDone }: { me: Me; onDone: () => void }) => {
  const update = useUpdateProfile({
    onSuccess: () => {
      toast.ok('Votre identité est à jour.');
      onDone();
    },
  });
  const { register, handleSubmit, setError, formState } = useForm<IdentityValues>({ resolver: zodResolver(schema), defaultValues: valuesOf(me) });
  const { errors } = formState;

  const onSubmit = handleSubmit((values) => {
    const body: ProfileInput = { ...values, date_of_birth: values.date_of_birth || null, phone: values.phone || null };
    update.mutate(body, {
      onError: (error) => {
        // Erreurs de champ renvoyées par DRF : { phone: ["…"] }
        if (error instanceof ApiError && error.body && typeof error.body === 'object') {
          const body = error.body as Record<string, unknown>;
          FIELDS.forEach((field) => {
            const messages = body[field];
            if (Array.isArray(messages) && typeof messages[0] === 'string') setError(field, { message: messages[0] });
          });
        }
      },
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-4">
      <Field id="pf-title" label="Civilité">
        <Select {...register('title')}>
          <option value="">Non précisée</option>
          <option value="MRS">Madame</option>
          <option value="MR">Monsieur</option>
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="pf-first" label="Prénom(s)" required error={errors.first_name?.message}>
          <Input autoComplete="given-name" {...register('first_name')} />
        </Field>
        <Field id="pf-last" label="Nom" required error={errors.last_name?.message}>
          <Input autoComplete="family-name" {...register('last_name')} />
        </Field>
      </div>
      <Field id="pf-dob" label="Date de naissance" error={errors.date_of_birth?.message}>
        <Input type="date" autoComplete="bday" {...register('date_of_birth')} />
      </Field>
      <Field id="pf-phone" label="Téléphone" hint="Format international : +221 77 000 00 00" error={errors.phone?.message}>
        <Input type="tel" autoComplete="tel" {...register('phone')} />
      </Field>
      {update.isError && !(update.error instanceof ApiError && update.error.status === 400) && (
        <p role="alert" className="m-0 text-sm text-err">
          {update.error instanceof ApiError ? update.error.message : 'L’enregistrement a échoué. Réessayez.'}
        </p>
      )}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        <Button variant="tertiary" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </form>
  );
};

/** 01 — Identité : lecture, puis édition en place (PATCH /me/). L'e-mail reste géré par Keycloak. */
export const IdentitySection = ({ me }: { me: Me }) => {
  const [editing, setEditing] = useState(false);
  const v = valuesOf(me);
  const fullName = [TITLE_LABEL[v.title], v.first_name, v.last_name].filter(Boolean).join(' ');
  return (
    <section aria-labelledby="pf-identite">
      <div className="flex items-baseline justify-between border-t border-line-strong pt-2">
        <h2 id="pf-identite" className="tnum m-0 text-meta font-normal text-ink-2">
          <span className="text-primary">01</span> — Identité
        </h2>
        {!editing && (
          <Button variant="tertiary" size="sm" onClick={() => setEditing(true)}>
            Modifier
          </Button>
        )}
      </div>
      {editing ? (
        <IdentityForm me={me} onDone={() => setEditing(false)} />
      ) : (
        <dl className="m-0 mt-2">
          {[
            ['Nom complet', fullName || 'Non renseigné'],
            ['Date de naissance', v.date_of_birth ? dayjs(v.date_of_birth).format('D MMMM YYYY') : 'Non renseignée'],
            ['Adresse e-mail', me.email],
            ['Téléphone', v.phone || 'Non renseigné'],
          ].map(([label, value]) => (
            <div key={label} className="grid grid-cols-[160px_minmax(0,1fr)] gap-4 border-b border-line py-3">
              <dt className="text-sm text-ink-3">{label}</dt>
              <dd className="m-0 break-words text-base text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
};
