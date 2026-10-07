'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { TopbarContent } from '@/components/layouts/shell-slots';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { LoadingBlock } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { useMe } from '@/hooks/use-me';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { useCreateRequest } from '../api/create-request';
import { useRequestOptions } from '../api/get-request-options';
import { useUploadFile } from '../api/upload-file';
import { STEP_FIELDS, toCreateBody, type WizardValues, wizardSchema } from '../utils/wizard-schema';

import { WizardAside } from './wizard-aside';
import { WizardStepInfos } from './wizard-step-infos';
import { WizardStepParish } from './wizard-step-parish';
import { WizardStepRecap } from './wizard-step-recap';
import { WizardStepType } from './wizard-step-type';
import { WizardSteps } from './wizard-steps';

const STEPS = ['Type d’acte', 'Paroisse du sacrement', 'Informations du registre', 'Vérification et envoi'];
const HEADINGS = ['Quel acte demandez-vous ?', 'Où le sacrement a-t-il été célébré ?', 'Comme au registre', 'Vérifier et envoyer'];
const INTROS = [
  'L’acte vous sera remis en original, signé et scellé par la paroisse.',
  'C’est la paroisse du sacrement qui tient le registre et délivre l’acte.',
  'Recopiez les informations telles qu’au jour du sacrement : elles guident la recherche dans le registre.',
  'Relisez votre demande avant de l’envoyer au secrétariat.',
];
const NEXT = ['Ensuite : la paroisse du sacrement', 'Ensuite : les informations du registre', 'Ensuite : vérification et envoi', null];

const Crumbs = () => (
  <TopbarContent
    start={<Breadcrumbs items={[{ label: 'Mes demandes', href: paths.app.demandes.list.getHref() }, { label: 'Nouvelle demande' }]} />}
  />
);

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
    const { first_name: first, last_name: last, date_of_birth: dob, phone } = me.profile;
    if (!getValues('last_name') && typeof last === 'string') setValue('last_name', last);
    if (!getValues('first_names') && typeof first === 'string') setValue('first_names', first);
    // Préremplir la date de naissance (profil en ISO → champ JJ/MM/AAAA) et le téléphone (JB-WEB-028).
    if (!getValues('date_of_birth') && typeof dob === 'string' && dayjs(dob).isValid()) {
      setValue('date_of_birth', dayjs(dob).format('DD/MM/YYYY'));
    }
    if (!getValues('contact_phone') && typeof phone === 'string') setValue('contact_phone', phone);
    if (!getValues('contact_email')) setValue('contact_email', me.email);
  }, [me, getValues, setValue]);

  // À chaque changement d'étape, le focus va au titre de l'étape (lecteurs d'écran, clavier).
  useEffect(() => {
    if (previousStep.current !== step) headingRef.current?.focus();
    previousStep.current = step;
  }, [step]);

  if (options.isPending)
    return (
      <>
        <Crumbs />
        <LoadingBlock label="Préparation du formulaire…" lines={5} />
      </>
    );
  if (options.isError)
    return (
      <>
        <Crumbs />
        <EmptyState tone="err" icon="alerte" title="Le formulaire n’a pas pu être chargé.">
          Vérifiez votre connexion, puis rechargez la page.
        </EmptyState>
      </>
    );

  const goTo = async (next: number) => {
    if (next > step) {
      const valid = await form.trigger(STEP_FIELDS[step], { shouldFocus: true });
      if (!valid) {
        // Repli : certains champs (choix de la paroisse) sont des composants sans ref focusable,
        // que `shouldFocus` ne peut pas atteindre — le focus restait alors sur le bouton. On place
        // le focus sur le premier champ marqué invalide (JB-WEB-028).
        requestAnimationFrame(() => {
          const invalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
          if (invalid && invalid !== document.activeElement) invalid.focus?.();
        });
        return;
      }
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

  const values = form.watch();
  const typeLabel =
    values.document_type === 'other' && values.document_type_free
      ? values.document_type_free
      : options.data.document_types.find((t) => t.value === values.document_type)?.label;
  const errorCount = step === 2 ? Object.keys(form.formState.errors).length : 0;
  const summaries = [
    typeLabel,
    values.parish?.name,
    errorCount > 0 ? `${errorCount} champ${errorCount > 1 ? 's' : ''} à corriger` : step > 2 ? 'Complétées' : 'Identité, motif, retrait',
    'Relecture avant envoi',
  ];

  return (
    <FormProvider {...form}>
      <Crumbs />
      <h1 className="m-0 text-28 font-semibold text-ink sm:text-32">Demander un extrait d’acte</h1>
      <p className="m-0 mt-2 text-16 text-ink-2">La demande part au secrétariat de la paroisse où le sacrement a été célébré, qui tient le registre.</p>

      <div className="mt-8">
        <WizardSteps steps={STEPS.map((title, i) => ({ title, summary: summaries[i] }))} current={step} />
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_336px]">
        <form
          aria-label={STEPS[step]}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step < STEPS.length - 1) void goTo(step + 1);
            else void submit();
          }}
          className="min-w-0 rounded-16 border border-line bg-paper shadow-card"
        >
          <div className="px-5 pt-6 sm:px-8 sm:pt-8">
            <h2 ref={headingRef} tabIndex={-1} className="m-0 scroll-mt-24 text-22 font-semibold text-ink focus:outline-none">
              {HEADINGS[step]}
            </h2>
            <p className="m-0 mt-1 text-15 text-ink-2">{INTROS[step]}</p>
            <div className="mt-6">
              {step === 0 && <WizardStepType options={options.data} />}
              {step === 1 && <WizardStepParish />}
              {step === 2 && (
                <WizardStepInfos options={options.data} file={file} onFileChange={setFile} followed={me?.paroisse_suivie ?? null} onEdit={() => goTo(0)} />
              )}
              {step === 3 && <WizardStepRecap options={options.data} file={file} followed={me?.paroisse_suivie ?? null} onEdit={goTo} />}
            </div>

            {error && (
              <Notice tone="err" title="La demande n’a pas pu être envoyée." className="mt-6">
                <span role="alert">{error.message}</span>
              </Notice>
            )}
          </div>

          <div
            className={cn(
              'mt-7 flex flex-col-reverse gap-4 border-t border-line px-5 py-5 sm:flex-row sm:items-center sm:px-8',
              step > 0 ? 'sm:justify-between' : 'sm:justify-end',
            )}
          >
            {step > 0 && (
              <Button variant="outline" size="lg" onClick={() => goTo(step - 1)}>
                <Icon name="chevron-gauche" size={18} />
                Retour
              </Button>
            )}
            <span className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:gap-4">
              {NEXT[step] && <span className="text-14 text-ink-3">{NEXT[step]}</span>}
              <Button type="submit" size="lg" disabled={busy}>
                {step < 2 ? 'Continuer' : step === 2 ? 'Voir le récapitulatif' : busy ? 'Envoi…' : 'Envoyer la demande'}
              </Button>
            </span>
          </div>
        </form>

        <WizardAside options={options.data} onEdit={goTo} className="hidden lg:flex" />
      </div>
    </FormProvider>
  );
};
