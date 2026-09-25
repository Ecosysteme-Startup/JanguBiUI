'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Stepper } from '@/components/signature/stepper';
import { Button } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { displayName, useMe } from '@/hooks/use-me';

import { useCompleteOnboarding } from '../api/complete-onboarding';
import { useConsent } from '../api/get-consent';
import type { Parish } from '../api/search-parishes';

import { ParishPicker } from './parish-picker';

const schema = z.object({
  parish: z.custom<Parish>((v) => v !== null && typeof v === 'object', { message: 'Choisissez la paroisse que vous suivez.' }),
  appartenance: z.boolean().refine((v) => v, { message: 'Cet accord est nécessaire pour suivre une paroisse.' }),
  conditions: z.boolean().refine((v) => v, { message: 'Acceptez les conditions d’utilisation pour continuer.' }),
  annonces: z.boolean(),
});
type OnboardingValues = z.input<typeof schema>;

/** Étapes 2 et 3 de l'inscription (PUB-Inscription-Paroisse) : paroisse, récapitulatif, consentements. */
export const OnboardingForm = () => {
  const router = useRouter();
  const { data: me } = useMe();
  const consent = useConsent();
  const complete = useCompleteOnboarding({ onSuccess: () => router.replace(paths.app.root.getHref()) });
  const { control, register, handleSubmit, watch, formState } = useForm<OnboardingValues>({
    resolver: zodResolver(schema),
    defaultValues: { appartenance: false, conditions: false, annonces: true },
  });
  const parish = watch('parish') as Parish | undefined;
  const name = displayName(me);

  if (consent.isPending) return <LoadingBlock label="Préparation de votre inscription…" />;

  const onSubmit = handleSubmit((values) =>
    complete.mutate({
      nodeId: (values.parish as Parish).id,
      consentVersion: consent.data?.current_version ?? '',
      annonces: values.annonces,
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stepper label="Étapes de l’inscription" steps={['Votre compte', 'Votre paroisse', 'Récapitulatif et consentements']} current={1} />
      <p className="tnum m-0 mt-8 text-meta text-primary">Étapes 2 et 3 sur 3</p>
      <h1 className="m-0 mt-2 font-serif text-title font-normal text-ink">Choisir la paroisse que je suis</h1>
      <p className="m-0 mt-2 text-base text-ink-2">
        En général, celle où vous allez à la messe le dimanche. Ce n&apos;est pas forcément votre paroisse de baptême.
      </p>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Controller
          control={control}
          name="parish"
          render={({ field, fieldState }) => (
            <ParishPicker value={(field.value as Parish | undefined) ?? null} onChange={field.onChange} error={fieldState.error?.message} />
          )}
        />
        <section aria-labelledby="recap-titre" className="rounded border border-line-strong bg-surface p-6">
          <p id="recap-titre" className="tnum m-0 text-meta text-primary">
            03 · Récapitulatif
          </p>
          <dl className="m-0 mt-4">
            <div className="border-t border-line py-3">
              <dt className="tnum text-meta text-ink-3">Compte</dt>
              <dd className="m-0 mt-1.5 text-body font-semibold text-ink">{name.full}</dd>
              <dd className="m-0 mt-0.5 text-sm text-ink-2">{me?.email}</dd>
            </div>
            <div className="border-t border-line py-3">
              <dt className="tnum text-meta text-ink-3">Paroisse suivie</dt>
              <dd className="m-0 mt-1.5 font-serif text-h4 text-ink">{parish?.name ?? 'À choisir'}</dd>
              {parish?.city && <dd className="m-0 mt-0.5 text-sm text-ink-2">{parish.city}</dd>}
            </div>
            <div className="border-t border-line py-3">
              <dt className="tnum text-meta text-ink-3">Paroisse de baptême</dt>
              <dd className="m-0 mt-1.5 text-sm text-ink-2">Demandée seulement lors d&apos;une demande d&apos;extrait d&apos;acte.</dd>
            </div>
          </dl>
        </section>
      </div>

      <section aria-labelledby="consent-titre" className="mt-8 border-t border-line-strong pt-2">
        <h2 id="consent-titre" className="tnum m-0 text-meta font-normal text-ink-2">
          <span className="text-primary">03</span> — Consentements
        </h2>
        <div role="note" className="mt-4 rounded border border-line bg-surface p-5">
          <p className="m-0 text-base font-semibold text-ink">Une donnée sensible</p>
          <p className="m-0 mt-1 text-sm text-ink-2">
            Suivre une paroisse révèle une appartenance religieuse. La loi n° 2008-12 sur les données personnelles exige votre accord exprès,
            distinct des conditions d&apos;utilisation.
          </p>
          <NextLink href={paths.confidentialite.getHref()} className="mt-2 inline-block text-sm">
            Lire la politique de confidentialité
          </NextLink>
        </div>
        <fieldset className="m-0 mt-5 flex flex-col gap-4 border-0 p-0">
          <legend className="sr-only">Consentements</legend>
          <Choice
            {...register('appartenance')}
            aria-invalid={Boolean(formState.errors.appartenance)}
            label={
              <>
                J&apos;accepte que Jàngu Bi enregistre mon appartenance à la paroisse {parish?.name ?? 'choisie'}, et que son secrétariat et ses
                prêtres en aient connaissance. <span className="text-err">*</span>
              </>
            }
            description={formState.errors.appartenance && <span role="alert" className="text-err">{formState.errors.appartenance.message}</span>}
          />
          <Choice
            {...register('conditions')}
            aria-invalid={Boolean(formState.errors.conditions)}
            label={
              <>
                J&apos;accepte les <NextLink href={paths.conditions.getHref()}>conditions d&apos;utilisation</NextLink>. <span className="text-err">*</span>
              </>
            }
            description={formState.errors.conditions && <span role="alert" className="text-err">{formState.errors.conditions.message}</span>}
          />
          <Choice {...register('annonces')} label={<>Recevoir une notification pour les annonces du dimanche. <span className="text-ink-3">Facultatif</span></>} />
        </fieldset>
      </section>

      {complete.isError && (
        <p role="alert" className="mt-4 text-sm text-err">
          {complete.error.message}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <span className="text-sm text-ink-3">Vous pourrez retirer ces accords à tout moment.</span>
        <Button type="submit" size="lg" disabled={complete.isPending}>
          {complete.isPending ? 'Enregistrement…' : 'Terminer mon inscription'} <Icon name="fleche-droite" size={16} />
        </Button>
      </div>
    </form>
  );
};
