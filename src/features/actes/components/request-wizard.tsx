'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Stepper } from '@/components/signature/stepper';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { LoadingBlock } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { useMe } from '@/hooks/use-me';
import { cn } from '@/utils/cn';

import { useCreateRequest } from '../api/create-request';
import { useRequestOptions } from '../api/get-request-options';
import { useUploadFile } from '../api/upload-file';
import { STEP_FIELDS, toCreateBody, type WizardValues, wizardSchema } from '../utils/wizard-schema';

import { WizardAside } from './wizard-aside';
import { WizardStepInfos } from './wizard-step-infos';
import { WizardStepParish } from './wizard-step-parish';
import { WizardStepRecap } from './wizard-step-recap';
import { WizardStepType } from './wizard-step-type';

const STEPS = ['Type d’acte', 'Paroisse du sacrement', 'Informations', 'Récapitulatif'];
const HEADINGS = ['Quel acte demandez-vous ?', 'Où le sacrement a-t-il été célébré ?', 'Vos informations', 'Vérifier et envoyer'];

const EMPTY: WizardValues = {
  document_type: '',
  document_type_free: '',
  parish: null,
  last_name: '',
  first_names: '',
  date_of_birth: '',
  place_of_birth: '',
  father: '',
  mother: '',
  contact_phone: '',
  contact_email: '',
  sacrament_month: '',
  sacrament_year: '',
  reason: '',
  reason_free: '',
  spouse_groom: '',
  spouse_bride: '',
  celebration_type: '',
  additional_info: '',
  pickup_mode: 'secretariat',
  consent: false,
};

/** FID-Demande-Nouvelle / MOB-Demande-Nouvelle : assistant en quatre étapes. */
export const RequestWizard = () => {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(0);
  const options = useRequestOptions();
  const { data: me } = useMe();
  const upload = useUploadFile();
  const create = useCreateRequest({
    onSuccess: (request) => {
      toast.ok(`Demande ${request.reference} transmise à ${request.target_node?.name ?? 'la paroisse'}.`);
      router.push(paths.app.demandes.detail.getHref(request.id));
    },
  });
  const form = useForm<WizardValues>({ resolver: zodResolver(wizardSchema), defaultValues: EMPTY, mode: 'onTouched' });

  // Préremplissage depuis le profil : le fidèle corrige si l'acte porte un autre nom.
  const { getValues, setValue } = form;
  useEffect(() => {
    if (!me) return;
    const { first_name: first, last_name: last } = me.profile;
    if (!getValues('last_name') && typeof last === 'string') setValue('last_name', last);
    if (!getValues('first_names') && typeof first === 'string') setValue('first_names', first);
    if (!getValues('contact_email')) setValue('contact_email', me.email);
  }, [me, getValues, setValue]);

  // À chaque changement d'étape, le focus va au titre de l'étape (lecteurs d'écran, clavier).
  useEffect(() => {
    if (previousStep.current !== step) headingRef.current?.focus();
    previousStep.current = step;
  }, [step]);

  if (options.isPending) return <LoadingBlock label="Préparation du formulaire…" lines={5} />;
  if (options.isError)
    return (
      <EmptyState tone="err" icon="alerte" title="Le formulaire n’a pas pu être chargé.">
        Vérifiez votre connexion, puis rechargez la page.
      </EmptyState>
    );

  const goTo = async (next: number) => {
    if (next > step) {
      const valid = await form.trigger(STEP_FIELDS[step], { shouldFocus: true });
      if (!valid) return;
    }
    setStep(next);
  };

  const submit = form.handleSubmit(async (values) => {
    try {
      const attachmentId = file ? await upload.mutateAsync(file) : null;
      create.mutate(toCreateBody(values, attachmentId));
    } catch {
      // L'erreur d'envoi du fichier est affichée sous le formulaire.
    }
  });

  const error = upload.error ?? create.error;
  const busy = upload.isPending || create.isPending;

  return (
    <FormProvider {...form}>
      <NextLink href={paths.app.demandes.list.getHref()} className="inline-flex h-11 items-center gap-2 text-sm font-medium">
        <Icon name="fleche-gauche" size={18} />
        Retour · Mes demandes
      </NextLink>

      <header className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-end">
        <div>
          <p className="tnum m-0 text-meta text-ink-2">
            <span className="text-primary">03</span> — Demande d’acte · étape {step + 1} sur {STEPS.length}
          </p>
          <h1 className="m-0 mt-3 font-serif text-h2 font-normal text-ink lg:text-[50px] lg:leading-none">
            Nouvelle <em className="italic text-primary">demande</em>
          </h1>
        </div>
        <Stepper label="Étapes de la demande" steps={STEPS} current={step} />
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-6">
        <form
          aria-label={STEPS[step]}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step < STEPS.length - 1) void goTo(step + 1);
            else void submit();
          }}
          className="min-w-0 lg:col-span-8"
        >
          <h2 ref={headingRef} tabIndex={-1} className="m-0 mb-6 scroll-mt-24 font-serif text-h3 font-normal text-ink focus:outline-none">{HEADINGS[step]}</h2>
          {step === 0 && <WizardStepType options={options.data} />}
          {step === 1 && <WizardStepParish />}
          {step === 2 && (
            <WizardStepInfos options={options.data} file={file} onFileChange={setFile} followed={me?.paroisse_suivie ?? null} onEdit={() => goTo(0)} />
          )}
          {step === 3 && <WizardStepRecap options={options.data} file={file} followed={me?.paroisse_suivie ?? null} onEdit={goTo} />}

          {error && (
            <Notice tone="err" title="La demande n’a pas pu être envoyée." className="mt-6">
              <span role="alert">{error.message}</span>
            </Notice>
          )}

          <div className={cn('mt-8 flex flex-col-reverse gap-4 border-t border-line pt-6 sm:flex-row sm:items-center', step > 0 ? 'sm:justify-between' : 'sm:justify-end')}>
            {step > 0 && (
              <Button variant="tertiary" onClick={() => goTo(step - 1)}>
                <Icon name="fleche-gauche" size={18} />
                Étape précédente
              </Button>
            )}
            <Button type="submit" disabled={busy}>
              {step < 2 ? 'Continuer' : step === 2 ? 'Voir le récapitulatif' : busy ? 'Envoi…' : 'Envoyer la demande'}
              {!busy && <Icon name="fleche-droite" size={18} />}
            </Button>
          </div>
        </form>

        <WizardAside options={options.data} className="hidden lg:col-span-4 lg:flex" />
      </div>
    </FormProvider>
  );
};
