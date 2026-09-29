'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { apiErrorMessage, apiFieldErrors } from '@/utils/api-errors';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { usePublicParish } from '../../api/get-public-parish';
import { type FundCreateBody, type FundUpdateBody, useCreateFund, usePublishFund, useStaffFund, useUpdateFund } from '../../api/staff-funds';
import type { StaffFund } from '../../types/schemas';

import { CampaignPreview } from './campaign-preview';
import { CampaignVisualPicker, type VisualValue } from './campaign-visual-picker';
import { DonsTopbar } from './dons-topbar';
import { panelClasses, QueryFailure, Req } from './parts';

const TITLE_MAX = 80;
const USAGE_MAX = 600;
const digits = (v: string) => v.replace(/[\s\u00a0\u202f]/g, '');

const schema = z
  .object({
    title: z.string().trim().min(1, 'Le titre est obligatoire.').max(TITLE_MAX, `${TITLE_MAX} caractères au plus.`),
    description: z.string().trim().min(1, 'Dites à quoi servira l’argent.').max(USAGE_MAX, `${USAGE_MAX} caractères au plus.`),
    goal_amount: z.string().refine((v) => /^\d+$/.test(digits(v)) && Number(digits(v)) > 0, 'Indiquez l’objectif, en francs.'),
    starts_on: z.string().min(1, 'Indiquez la date de début.'),
    ends_on: z.string().min(1, 'Indiquez la date de fin.'),
    authorization_ref: z.string().trim().min(1, 'Indiquez la référence de l’autorisation diocésaine.').max(80, '80 caractères au plus.'),
  })
  .superRefine((v, ctx) => {
    if (v.starts_on && v.ends_on && v.ends_on < v.starts_on) ctx.addIssue({ code: 'custom', path: ['ends_on'], message: 'La fin doit suivre le début.' });
  });
type Values = z.infer<typeof schema>;
const FIELDS = ['title', 'description', 'goal_amount', 'starts_on', 'ends_on', 'authorization_ref'] as const;

const defaultsOf = (fund: StaffFund | null): Values => ({
  title: fund?.title ?? '',
  description: fund?.description ?? '',
  goal_amount: fund?.goal_amount ? String(fund.goal_amount) : '',
  starts_on: fund?.starts_on ?? '',
  ends_on: fund?.ends_on ?? '',
  authorization_ref: fund?.authorization_ref ?? '',
});

const STATUS_LABEL = { brouillon: 'Brouillon', ouvert: 'Ouverte', clos: 'Close' } as const;

type FormProps = { nodeId: string; fund: StaffFund | null };

const CampaignForm = ({ nodeId, fund }: FormProps) => {
  const router = useRouter();
  const parish = usePublicParish(nodeId);
  const [visual, setVisual] = useState<VisualValue>({ id: null, url: fund?.image_url ?? null, changed: false });
  const [serverError, setServerError] = useState<string | null>(null);
  const create = useCreateFund(nodeId);
  const update = useUpdateFund(nodeId);
  const publish = usePublishFund(nodeId);
  const pending = create.isPending || update.isPending || publish.isPending;
  const status = fund?.status ?? 'brouillon';
  const isOpen = status === 'ouvert';
  const closed = status === 'clos';

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaultsOf(fund) });
  const values = watch();

  const fail = (error: unknown) => {
    const fields = apiFieldErrors(error);
    let matched = false;
    FIELDS.forEach((f) => {
      if (fields[f]) {
        setError(f, { type: 'server', message: fields[f] });
        matched = true;
      }
    });
    if (fields.image_id) setServerError(fields.image_id);
    else if (!matched) setServerError(apiErrorMessage(error));
  };

  const save = (andPublish: boolean) =>
    handleSubmit(async (v) => {
      setServerError(null);
      const common = {
        title: v.title.trim(),
        description: v.description.trim(),
        starts_on: v.starts_on,
        ends_on: v.ends_on,
        goal_amount: Number(digits(v.goal_amount)),
        authorization_ref: v.authorization_ref.trim(),
      };
      try {
        let saved: StaffFund;
        if (fund) {
          const body: FundUpdateBody = { ...common, ...(visual.changed ? { image_id: visual.id } : {}) };
          saved = await update.mutateAsync({ id: fund.id, body });
        } else {
          const body: FundCreateBody = { node: nodeId, kind: 'campagne', ...common, image_id: visual.id };
          saved = await create.mutateAsync(body);
        }
        if (andPublish && saved.status === 'brouillon') {
          await publish.mutateAsync(saved.id);
          toast.ok('Campagne publiée : elle est visible des fidèles.');
          router.push(paths.espace.dons.root.getHref(nodeId));
          return;
        }
        toast.ok(isOpen ? 'Modifications enregistrées.' : 'Brouillon enregistré.');
        if (!fund) router.replace(paths.espace.dons.campagne.getHref(nodeId, saved.id));
      } catch (error) {
        fail(error);
      }
    });

  const goal = /^\d+$/.test(digits(values.goal_amount)) ? Number(digits(values.goal_amount)) : null;

  return (
    <div className="flex flex-col">
      <DonsTopbar nodeId={nodeId} current={fund ? fund.title : 'Nouvelle campagne'} />
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge tone={isOpen ? 'ok' : closed ? 'muted' : 'neutral'} dot>
              {STATUS_LABEL[status]}
            </Badge>
            {fund?.published_at && <span className="text-14 text-ink-3">Publiée le {dayjs(fund.published_at).format('D MMMM YYYY')}</span>}
          </div>
          <h1 className="m-0 mt-2 text-32 font-semibold text-ink">{fund ? 'Modifier la campagne' : 'Nouvelle campagne'}</h1>
          <p className="m-0 mt-1 text-16 text-ink-2">Un projet précis, un objectif, une durée.</p>
        </div>
        {!closed && (
          <div className="flex flex-wrap gap-2 lg:pt-8">
            <NextLink href={paths.espace.dons.root.getHref(nodeId)} className={cn(buttonVariants({ variant: 'outline' }), 'h-11 text-14')}>
              Annuler
            </NextLink>
            <Button variant={isOpen ? 'primary' : 'outline'} className={cn('h-11', !isOpen && 'text-14')} disabled={pending} onClick={save(false)}>
              {isOpen ? 'Enregistrer les modifications' : 'Enregistrer en brouillon'}
            </Button>
            {!isOpen && (
              <Button className="h-11 px-5" loading={pending} onClick={save(true)}>
                Publier maintenant
              </Button>
            )}
          </div>
        )}
      </header>

      {closed && (
        <Notice tone="info" className="mt-6" title="Campagne close">
          Une campagne close ne se modifie plus.
        </Notice>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_368px]">
        <form id="campagne-form" noValidate onSubmit={save(false)} className="flex min-w-0 flex-col gap-6">
          <fieldset disabled={closed} className="m-0 flex min-w-0 flex-col gap-6 border-0 p-0">
            <section aria-labelledby="campagne-t-desc" className={cn(panelClasses, 'flex flex-col gap-6 p-6')}>
              <h2 id="campagne-t-desc" className="m-0 text-20 font-semibold text-ink">
                La campagne
              </h2>
              <Field
                id="campagne-titre"
                label={<Req>Titre</Req>}
                required
                labelAside={
                  <span className="tnum text-13 font-normal text-ink-3">
                    {values.title.length} / {TITLE_MAX}
                  </span>
                }
                error={errors.title?.message}
              >
                <Input controlSize="sm" maxLength={TITLE_MAX} {...register('title')} />
              </Field>
              <Field
                id="campagne-usage"
                label={<Req>Usage des fonds</Req>}
                required
                labelAside={
                  <span className="tnum text-13 font-normal text-ink-3">
                    {values.description.length} / {USAGE_MAX}
                  </span>
                }
                hint="Dites simplement à quoi servira l’argent. Ce texte est lu par les fidèles avant de donner."
                error={errors.description?.message}
              >
                <Textarea controlSize="sm" rows={4} className="min-h-28" maxLength={USAGE_MAX} {...register('description')} />
              </Field>
              <Field
                id="campagne-objectif"
                label={<Req>Objectif</Req>}
                required
                hint="La collecte se ferme dès que l’objectif est atteint."
                error={errors.goal_amount?.message}
                className="sm:max-w-[calc(50%-8px)]"
              >
                <Input controlSize="sm" inputMode="numeric" className="tnum" trailing={<span className="text-14 text-ink-3">FCFA</span>} {...register('goal_amount')} />
              </Field>
              <div className="grid items-start gap-4 sm:grid-cols-2">
                <Field id="campagne-debut" label={<Req>Début</Req>} required error={errors.starts_on?.message}>
                  <Input controlSize="sm" type="date" icon="calendrier" className="tnum" {...register('starts_on')} />
                </Field>
                <Field id="campagne-fin" label={<Req>Fin</Req>} required error={errors.ends_on?.message}>
                  <Input controlSize="sm" type="date" icon="calendrier" className="tnum" {...register('ends_on')} />
                </Field>
              </div>
            </section>

            <section aria-labelledby="campagne-t-visuel" className={cn(panelClasses, 'flex flex-col gap-4 p-6')}>
              <div>
                <h2 id="campagne-t-visuel" className="m-0 text-20 font-semibold text-ink">
                  Visuel
                </h2>
                <p className="m-0 mt-0.5 text-14 text-ink-2">Une photo du lieu ou du projet. Pas de visage reconnaissable sans accord.</p>
              </div>
              <CampaignVisualPicker value={visual} onChange={setVisual} />
            </section>

            <section aria-labelledby="campagne-t-autorisation" className={cn(panelClasses, 'flex flex-col gap-4 p-6')}>
              <h2 id="campagne-t-autorisation" className="m-0 text-20 font-semibold text-ink">
                Autorisation
              </h2>
              <Field
                id="campagne-autorisation"
                label={<Req>Référence de l’autorisation diocésaine</Req>}
                required
                hint="Elle est affichée aux fidèles sous le bouton de don."
                error={errors.authorization_ref?.message}
              >
                <Input controlSize="sm" icon="bouclier" className="tnum" maxLength={80} {...register('authorization_ref')} />
              </Field>
              <Notice tone="info" title="La campagne sera visible des fidèles dès sa publication, sur l’application et sur la fiche publique de la paroisse. Aucun classement ni liste de donateurs n’est affiché." />
            </section>
          </fieldset>
          {serverError && (
            <Notice tone="err" role="alert" title="La campagne n’a pas été enregistrée">
              {serverError}
            </Notice>
          )}
        </form>
        <CampaignPreview
          title={values.title}
          description={values.description}
          goal={goal}
          raised={fund?.raised ?? 0}
          startsOn={values.starts_on}
          endsOn={values.ends_on}
          imageUrl={visual.url}
          statusLabel={STATUS_LABEL[status]}
          authorization={parish.data?.authorization}
        />
      </div>
    </div>
  );
};

/** WEB-PAR-Campagne-Editeur : création (`fundId` absent) ou modification d'une campagne du nœud. */
export const CampaignEditor = ({ nodeId, fundId }: { nodeId: string; fundId?: string }) => {
  const fund = useStaffFund(fundId);
  if (!fundId) return <CampaignForm nodeId={nodeId} fund={null} />;
  if (fund.isPending) return <LoadingBlock label="Chargement de la campagne…" lines={6} />;
  if (fund.isError) return <QueryFailure error={fund.error} nodeId={nodeId} what="Campagne" />;
  return <CampaignForm key={fund.data.id} nodeId={nodeId} fund={fund.data} />;
};
