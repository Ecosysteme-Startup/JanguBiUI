'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Choice } from '@/components/ui/choice';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { displayName, useMe } from '@/hooks/use-me';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { useCompleteOnboarding } from '../api/complete-onboarding';
import { useConsent } from '../api/get-consent';
import type { DirectoryParish } from '../api/get-directory';

import { ParishPicker } from './parish-picker';
import { ParishPreview } from './parish-preview';

const schema = z.object({
  parish: z.custom<DirectoryParish>((v) => v !== null && typeof v === 'object', { message: 'Choisissez la paroisse que vous suivez.' }),
  conditions: z.boolean().refine((v) => v, { message: 'Acceptez les conditions d’utilisation pour continuer.' }),
  appartenance: z.boolean().refine((v) => v, { message: 'Cet accord est nécessaire pour suivre une paroisse.' }),
  annonces: z.boolean(),
  /** Accord d'un parent ou tuteur, exigé uniquement pour un mineur (validé côté composant). */
  accordParental: z.boolean(),
});
type OnboardingValues = z.input<typeof schema>;

const STEPS = ['Vos informations', 'Votre paroisse', 'Consentements'];

/** Étapes de l'inscription (l'étape 1, le compte, est faite dans Keycloak). */
const SignupStepper = ({ current }: { current: 1 | 2 }) => (
  <ol aria-label="Étapes de l’inscription" className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-2 p-0 text-15">
    {STEPS.map((label, index) => {
      const done = index < current;
      const active = index === current;
      return (
        <li key={label} aria-current={active ? 'step' : undefined} className="flex items-center gap-4">
          {index > 0 && <span aria-hidden="true" className={cn('hidden h-px w-16 sm:block', done || active ? 'bg-line-active' : 'bg-line')} />}
          <span className={cn('flex items-center gap-2.5', active ? 'font-semibold text-ink' : done ? 'text-ink-2' : 'text-ink-3')}>
            <span
              className={cn(
                'inline-flex size-7 shrink-0 items-center justify-center rounded-full text-14',
                done && 'bg-tint-100 text-tint-800',
                active && 'bg-primary-fill text-on-primary',
                !done && !active && 'border-1.5 border-line-field font-semibold text-ink-2',
              )}
            >
              {done ? <Icon name="check" size={15} /> : index + 1}
              {done && <span className="sr-only">Étape terminée : </span>}
            </span>
            <span className={cn(!active && 'hidden sm:inline')}>{label}</span>
          </span>
        </li>
      );
    })}
  </ol>
);

const RecapRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-1 gap-1 border-b border-line px-5 py-3 last:border-b-0 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-3">
    <dt className="text-ink-2">{label}</dt>
    <dd className="m-0 min-w-0 break-words font-semibold text-ink">{children}</dd>
  </div>
);

/** Carte d'accord (consentement) : case, badge éventuel, texte et précision. */
const consentCard = 'rounded-16 border border-line bg-paper px-5 py-4 text-16 leading-6 has-[:checked]:border-line-active';

/**
 * Étapes 2 et 3 de l'inscription (WEB-Inscription-Paroisse, WEB-Inscription-Consentement) :
 * paroisse suivie, puis accords séparés (conditions, donnée sensible loi 2008-12) et préférence
 * facultative. Rien n'est coché d'avance ; le consentement porte la version courante des
 * conditions, sans laquelle rien n'est envoyé.
 */
export const OnboardingForm = () => {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const { data: me } = useMe();
  const consent = useConsent();
  const complete = useCompleteOnboarding({ onSuccess: () => router.replace(paths.app.root.getHref()) });
  const { control, register, handleSubmit, watch, trigger, formState } = useForm<OnboardingValues>({
    resolver: zodResolver(schema),
    defaultValues: { conditions: false, appartenance: false, annonces: false, accordParental: false },
  });
  const parish = (watch('parish') as DirectoryParish | undefined) ?? null;

  if (consent.isPending) return <LoadingBlock label="Préparation de votre inscription…" />;
  // Sans version courante des conditions, le consentement serait refusé par l'API :
  // on n'affiche pas un formulaire qui échouerait à l'envoi.
  const consentVersion = consent.data?.current_version;
  if (!consentVersion) {
    return (
      <EmptyState
        tone="err"
        icon="alerte"
        title="Votre inscription n’a pas pu être préparée"
        action={
          <Button variant="secondary" onClick={() => consent.refetch()}>
            Réessayer
          </Button>
        }
      >
        Vérifiez votre connexion, puis réessayez.
      </EmptyState>
    );
  }

  const onSubmit = handleSubmit((values) =>
    complete.mutate({ nodeId: (values.parish as DirectoryParish).id, consentVersion, annonces: values.annonces }),
  );
  const next = async () => {
    if (await trigger('parish')) {
      setStep(2);
    }
  };

  const name = displayName(me);
  const phone = typeof me?.profile.phone === 'string' ? me.profile.phone : '';
  const birth = typeof me?.profile.date_of_birth === 'string' ? me.profile.date_of_birth : '';
  // Mineur : l'accord d'un parent ou tuteur est requis, et messagerie et dons restent fermés.
  const isMinor = birth !== '' && dayjs().diff(dayjs(birth), 'year') < 18;
  const ready = watch('conditions') && watch('appartenance') && (!isMinor || watch('accordParental'));

  return (
    <form onSubmit={onSubmit} noValidate>
      <SignupStepper current={step} />

      {step === 1 ? (
        <div className="mt-8 grid grid-cols-1 items-start gap-10 lg:grid-cols-[480px_minmax(0,1fr)] lg:gap-16 xl:gap-24">
          <div className="min-w-0">
            <h1 className="m-0 text-28 font-semibold text-ink md:text-32">Votre paroisse</h1>
            <p className="m-0 mt-2 text-16 text-ink-2">
              Celle que vous fréquentez : vous recevrez ses annonces et ses horaires. Vous pourrez en changer à tout moment.
            </p>
            <Controller
              control={control}
              name="parish"
              render={({ field, fieldState }) => (
                <ParishPicker value={(field.value as DirectoryParish | undefined) ?? null} onChange={field.onChange} error={fieldState.error?.message} />
              )}
            />
            <details open className="group mt-4 rounded-16 border border-line bg-surface">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 pb-1.5 pt-3.5 text-15 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                Ma paroisse n&apos;est pas encore sur Jàngu Bi
                <Icon name="chevron-bas" size={18} className="shrink-0 text-ink-2 transition-transform group-open:rotate-180" />
              </summary>
              <p className="m-0 px-4 pb-3.5 text-14 leading-[21px] text-ink-2">
                Choisissez-la quand même : vous verrez ses coordonnées, et ses horaires et annonces dès qu&apos;elle les publiera. Votre curé
                peut aussi{' '}
                <NextLink href={paths.contact.getHref()} className="font-semibold">
                  demander une présentation
                </NextLink>
                .
              </p>
            </details>
            <Button type="button" size="xl" block className="mt-8" onClick={next}>
              Continuer
            </Button>
          </div>
          <ParishPreview parish={parish} />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-16 xl:gap-20">
          <div className="min-w-0">
            <h1 className="m-0 text-28 font-semibold text-ink md:text-32">Avant de terminer</h1>
            <p className="m-0 mt-2 text-16 text-ink-2">
              Chaque accord est séparé et aucune case n&apos;est cochée d&apos;avance. Vous pourrez retirer un accord à tout moment dans votre profil.
            </p>
            <fieldset className="m-0 mt-6 border-0 p-0">
              <legend className="mb-2 p-0 text-14 font-medium text-ink-2">Requis pour créer le compte</legend>
              <div className="flex flex-col gap-2">
                <Choice
                  {...register('conditions')}
                  className={consentCard}
                  label={
                    <>
                      J&apos;accepte les{' '}
                      <NextLink href={paths.conditions.getHref()} target="_blank" className="font-semibold">
                        conditions d&apos;utilisation
                      </NextLink>{' '}
                      et j&apos;ai lu la{' '}
                      <NextLink href={paths.confidentialite.getHref()} target="_blank" className="font-semibold">
                        politique de confidentialité
                      </NextLink>
                      .
                    </>
                  }
                  description={<span className="mt-1 block text-13 text-ink-3">Traitement de vos données personnelles selon la loi n°&nbsp;2008-12.</span>}
                />
                <Choice
                  {...register('appartenance')}
                  className={consentCard}
                  label={
                    <>
                      <Badge tone="warn" icon="bouclier" className="mb-2 font-medium">
                        Donnée sensible
                      </Badge>
                      <span className="block">
                        J&apos;accepte que Jàngu Bi traite des données qui révèlent mon appartenance religieuse : paroisse suivie
                        {parish ? ` (${parish.name.replace(/^Paroisse\s+/i, '')})` : ''}, demandes d&apos;actes de sacrements, rendez-vous avec un
                        prêtre.
                      </span>
                    </>
                  }
                  description={
                    <span className="mt-1 block text-13 text-ink-3">
                      Consentement exprès exigé par la loi. Ces données ne sont transmises qu&apos;aux paroisses concernées. Si vous retirez cet
                      accord, le compte est fermé.
                    </span>
                  }
                />
                {isMinor && (
                  <>
                    <Notice tone="warn" className="mt-1" title="Vous avez moins de 18 ans">
                      La messagerie avec un prêtre et les dons en ligne ne sont pas accessibles aux mineurs. Votre inscription nécessite l&apos;accord
                      d&apos;un parent ou tuteur.
                    </Notice>
                    <Choice
                      {...register('accordParental')}
                      className={consentCard}
                      label="J’ai l’accord de mon parent ou de mon tuteur pour créer ce compte."
                      description={
                        <span className="mt-1 block text-13 text-ink-3">
                          Un parent ou tuteur peut nous écrire à{' '}
                          <a href="mailto:donnees@jangubi.sn" className="font-semibold">
                            donnees@jangubi.sn
                          </a>{' '}
                          pour toute question.
                        </span>
                      }
                    />
                  </>
                )}
              </div>
            </fieldset>
            <fieldset className="m-0 mt-6 border-0 p-0">
              <legend className="mb-2 p-0 text-14 font-medium text-ink-2">Facultatif</legend>
              <Choice
                {...register('annonces')}
                className={consentCard}
                label="Recevoir les changements d’horaires et les annonces de ma paroisse."
                description={<span className="mt-1 block text-13 text-ink-3">Au plus un message par semaine, sauf changement d&apos;horaire le jour même.</span>}
              />
            </fieldset>
            {complete.isError && (
              <Notice tone="err" role="alert" className="mt-6" title="L’inscription n’a pas pu être terminée.">
                {complete.error.message}
              </Notice>
            )}
            <div className="mt-8 grid grid-cols-[120px_minmax(0,1fr)] gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
              <Button type="button" variant="outline" size="xl" onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button type="submit" size="xl" disabled={!ready} loading={complete.isPending} aria-describedby="terminer-aide">
                {complete.isPending ? 'Enregistrement' : 'Terminer mon inscription'}
              </Button>
            </div>
            <p id="terminer-aide" className="m-0 mt-2.5 text-right text-13 text-ink-3">
              {ready
                ? 'Vous pourrez retirer ces accords à tout moment.'
                : isMinor
                  ? 'Cochez les accords requis, dont l’accord d’un parent ou tuteur, pour terminer votre inscription.'
                  : 'Cochez les 2 accords requis pour terminer votre inscription.'}
            </p>
            {formState.errors.parish && <p className="sr-only">{formState.errors.parish.message}</p>}
          </div>

          <aside aria-labelledby="recap-titre" className="self-start rounded-16 border border-line bg-surface p-6 lg:p-10">
            <h2 id="recap-titre" className="m-0 text-20 font-semibold text-ink">
              Récapitulatif
            </h2>
            <div className="mt-4 rounded-16 border border-line bg-paper text-15">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <span className="text-13 font-medium text-ink-3">Vos informations</span>
                <NextLink href={paths.app.profil.getHref()} className="text-14 font-semibold">
                  Modifier plus tard
                </NextLink>
              </div>
              <dl className="m-0">
                <RecapRow label="Nom">{name.full}</RecapRow>
                <RecapRow label="E-mail">{me?.email}</RecapRow>
                {phone && <RecapRow label="Téléphone">{phone}</RecapRow>}
                {birth && <RecapRow label="Date de naissance">{dayjs(birth).format('D MMMM YYYY')}</RecapRow>}
              </dl>
              <div className="flex items-center justify-between border-y border-line px-5 py-3">
                <span className="text-13 font-medium text-ink-3">Votre paroisse</span>
                <button type="button" onClick={() => setStep(1)} className="hit text-14 font-semibold text-primary hover:text-primary-strong">
                  Modifier
                </button>
              </div>
              <dl className="m-0">
                <RecapRow label="Paroisse suivie">
                  <span className="block">{parish?.name.replace(/^Paroisse\s+/i, '')}</span>
                  <span className="block text-13 font-normal text-ink-3">{[parish?.address || parish?.city, parish?.diocese_name].filter(Boolean).join(', ')}</span>
                </RecapRow>
              </dl>
            </div>
            <Notice className="mt-4 border border-line-active px-5 py-4" title="Vos droits sur vos données">
              Responsable du traitement : Numerisen, Dakar. Vous pouvez accéder à vos données, les rectifier, vous opposer à leur traitement ou
              les supprimer depuis votre profil ou en écrivant à{' '}
              <a href="mailto:donnees@jangubi.sn" className="font-semibold">
                donnees@jangubi.sn
              </a>
              . Recours possible auprès de la CDP.
            </Notice>
          </aside>
        </div>
      )}
    </form>
  );
};
