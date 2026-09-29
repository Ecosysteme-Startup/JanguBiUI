'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import { type FieldPath, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';

import { useContactDioceses } from '../api/get-dioceses';
import { type ContactBody, type Fonction, FONCTIONS, useSendContact } from '../api/send-contact';

export const MESSAGE_MAX = 1000;
const OTHER_DIOCESE = 'autre';

const emailField = z
  .string()
  .trim()
  .min(1, 'Indiquez votre adresse e-mail.')
  .superRefine((value, ctx) => {
    const [, domain] = value.split('@');
    if (domain !== undefined && domain.length > 0 && !domain.includes('.')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Adresse incomplète : il manque la fin, par exemple « .sn » ou « .com ».' });
    } else if (!z.string().email().safeParse(value).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Adresse e-mail invalide, par exemple prenom.nom@exemple.sn.' });
    }
  });

export const contactSchema = z.object({
  full_name: z.string().trim().min(2, 'Indiquez votre prénom et votre nom.').max(150, '150 caractères au plus.'),
  fonction: z.string().refine((v) => FONCTIONS.some((f) => f.value === v), 'Choisissez votre fonction.'),
  paroisse: z.string().trim().min(2, 'Indiquez la paroisse ou le service.').max(200, '200 caractères au plus.'),
  diocese: z.string().min(1, 'Choisissez le diocèse.'),
  telephone: z
    .string()
    .trim()
    .min(1, 'Indiquez un numéro de téléphone.')
    .refine((v) => /^\+?[0-9 .-]+$/.test(v) && v.replace(/\D/g, '').length >= 9 && v.replace(/\D/g, '').length <= 15, {
      message: 'Numéro à 9 chiffres, par exemple 77 543 18 62.',
    }),
  email: emailField,
  message: z.string().max(MESSAGE_MAX, `${MESSAGE_MAX} caractères au plus.`),
  consentement: z.boolean().refine((v) => v, 'Cet accord est nécessaire pour que nous puissions vous recontacter.'),
  cure_informe: z.boolean(),
});
export type ContactValues = z.input<typeof contactSchema>;

/** Valeurs du formulaire → corps de l'API (indicatif +221 ajouté aux numéros locaux). */
export const toContactBody = (values: ContactValues): ContactBody => {
  const telephone = values.telephone.trim();
  return {
    full_name: values.full_name.trim(),
    fonction: values.fonction as Fonction,
    paroisse: values.paroisse.trim(),
    diocese_node_id: values.diocese === OTHER_DIOCESE ? null : values.diocese,
    telephone: telephone.startsWith('+') ? telephone : `+221 ${telephone}`,
    email: values.email.trim(),
    message: values.message.trim(),
    consentement: true,
    cure_informe: values.cure_informe,
  };
};

const SERVER_FIELDS: Record<string, FieldPath<ContactValues>> = {
  full_name: 'full_name',
  fonction: 'fonction',
  paroisse: 'paroisse',
  diocese_node_id: 'diocese',
  telephone: 'telephone',
  email: 'email',
  message: 'message',
  consentement: 'consentement',
  cure_informe: 'cure_informe',
};

const DEFAULTS: ContactValues = {
  full_name: '',
  fonction: '',
  paroisse: '',
  diocese: '',
  telephone: '',
  email: '',
  message: '',
  consentement: false,
  cure_informe: false,
};

/**
 * Demande de présentation (PUB-Pour-les-paroisses, ancre #contact) : `POST /public/contact/`.
 * Erreurs sous chaque champ, récapitulatif du nombre de champs à corriger, erreurs du
 * serveur rattachées à leur champ.
 */
export const ContactForm = () => {
  const dioceses = useContactDioceses();
  const send = useSendContact();
  const { register, handleSubmit, watch, setError, formState } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: DEFAULTS,
  });
  const { errors, isSubmitted } = formState;
  const errorCount = Object.keys(errors).filter((key) => key !== 'root').length;
  const messageLength = watch('message')?.length ?? 0;

  const onSubmit = handleSubmit((values) =>
    send.mutate(toContactBody(values), {
      onError: (error) => {
        if (error instanceof ApiError && error.status === 400 && error.body && typeof error.body === 'object') {
          let mapped = false;
          Object.entries(error.body as Record<string, unknown>).forEach(([key, messages]) => {
            const field = SERVER_FIELDS[key];
            const message = Array.isArray(messages) ? String(messages[0]) : typeof messages === 'string' ? messages : null;
            if (field && message) {
              setError(field, { type: 'server', message });
              mapped = true;
            }
          });
          if (mapped) return;
        }
        setError('root', {
          type: 'server',
          message: error instanceof ApiError ? error.message : 'La demande n’a pas pu être envoyée. Réessayez dans un instant.',
        });
      },
    }),
  );

  if (send.isSuccess) {
    return (
      <div role="status" aria-live="polite">
        <Notice tone="ok" title="Votre demande est bien arrivée.">
          Merci. Nous vous rappelons sous 5 jours ouvrés pour fixer une présentation au presbytère ou à la chancellerie.
        </Notice>
      </div>
    );
  }

  return (
    <form aria-label="Demande de présentation" onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <p className="m-0 text-14 text-ink-3">Tous les champs sont requis, sauf mention contraire.</p>
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
        <Field id="c-nom" label="Nom et prénom" required error={errors.full_name?.message}>
          <Input autoComplete="name" {...register('full_name')} />
        </Field>
        <Field id="c-fonction" label="Fonction" required error={errors.fonction?.message}>
          <Select {...register('fonction')}>
            <option value="" disabled>
              Choisir…
            </option>
            {FONCTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="c-paroisse" label="Paroisse ou service" required error={errors.paroisse?.message}>
          <Input autoComplete="organization" {...register('paroisse')} />
        </Field>
        <Field
          id="c-diocese"
          label="Diocèse"
          required
          error={errors.diocese?.message}
          hint={dioceses.isError ? 'La liste des diocèses n’a pas pu être chargée : choisissez « Autre ».' : undefined}
        >
          <Select {...register('diocese')}>
            <option value="" disabled>
              {dioceses.isPending ? 'Chargement…' : 'Choisir…'}
            </option>
            {dioceses.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
            <option value={OTHER_DIOCESE}>Autre, ou je ne sais pas</option>
          </Select>
        </Field>
        <Field id="c-tel" label="Téléphone" required error={errors.telephone?.message} hint="Indicatif +221 ajouté pour un numéro sénégalais.">
          <Input type="tel" inputMode="tel" autoComplete="tel-national" className="tnum" {...register('telephone')} />
        </Field>
        <Field id="c-mail" label="Adresse e-mail" required error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </Field>
      </div>
      <Field
        id="c-message"
        label="Message"
        optional
        error={errors.message?.message}
        hint="Nombre de fidèles, lieux de culte, date souhaitée…"
        counter={{ value: messageLength, max: MESSAGE_MAX }}
      >
        <Textarea rows={4} {...register('message')} />
      </Field>
      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="sr-only">Consentement</legend>
        <Choice
          {...register('consentement')}
          aria-invalid={errors.consentement ? true : undefined}
          aria-describedby={errors.consentement ? 'c-consentement-message' : undefined}
          label={
            <>
              J&apos;accepte que Numerisen utilise ces informations pour me recontacter au sujet de Jàngu Bi. Elles ne sont ni partagées ni
              utilisées pour autre chose.{' '}
              <NextLink href={paths.confidentialite.getHref()} className="font-semibold">
                Confidentialité
              </NextLink>
            </>
          }
        />
        {errors.consentement && (
          <p id="c-consentement-message" role="alert" className="m-0 flex gap-1.5 text-13 text-err">
            {errors.consentement.message}
          </p>
        )}
        <Choice {...register('cure_informe')} label="Le curé de la paroisse est informé de cette démarche (facultatif)." />
      </fieldset>
      {errors.root?.message && (
        <Notice tone="err" role="alert" title="Envoi impossible">
          {errors.root.message}
        </Notice>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <Button type="submit" size="xl" className="px-7" loading={send.isPending}>
          {send.isPending ? 'Envoi en cours' : 'Envoyer la demande'}
        </Button>
        <span aria-live="polite" className="text-14 text-ink-3">
          {isSubmitted && errorCount > 0
            ? `${errorCount} champ${errorCount > 1 ? 's' : ''} à corriger avant l’envoi.`
            : 'Nous vous répondons sous 5 jours ouvrés.'}
        </span>
      </div>
    </form>
  );
};
