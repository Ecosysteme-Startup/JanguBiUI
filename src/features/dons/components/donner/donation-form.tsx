'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/utils/cn';

import {
  type CheckoutBody,
  newIdempotencyKey,
  useCreateCheckout,
} from '../../api/create-checkout';
import type { PublicParish } from '../../types/schemas';
import { amount, breakdown, fcfa } from '../../utils/format';

import { saveCheckout } from './checkout-storage';
import {
  AmountPills,
  FundCard,
  FundRow,
  OptionCheckbox,
  PaymentReassurance,
} from './donation-controls';
import { DonationSummary } from './donation-summary';
import { shortParishName } from './fund-labels';

const NBSP = ' ';

export type DonationFormVariant = 'fidele' | 'public';

type Values = {
  fund_id: string;
  preset: number | null;
  other: string;
  fees_covered: boolean;
  anonymous: boolean;
  email: string;
};

/** Montant retenu : le montant libre s'il est saisi, sinon la pilule choisie. */
const amountOf = (v: Pick<Values, 'preset' | 'other'>): number | null => {
  const other = v.other.trim();
  if (other) return Number(other);
  return v.preset;
};

const makeSchema = (min: number, max: number) =>
  z
    .object({
      fund_id: z.string().min(1, 'Choisissez un fonds.'),
      preset: z.number().nullable(),
      other: z.string(),
      fees_covered: z.boolean(),
      anonymous: z.boolean(),
      email: z.union([
        z.literal(''),
        z.string().trim().email('Saisissez une adresse e-mail valide.'),
      ]),
    })
    .superRefine((v, ctx) => {
      const value = amountOf(v);
      if (value === null || Number.isNaN(value)) {
        ctx.addIssue({
          code: 'custom',
          path: ['other'],
          message: 'Choisissez un montant ou saisissez-en un autre.',
        });
      } else if (value < min) {
        ctx.addIssue({
          code: 'custom',
          path: ['other'],
          message: `Le montant minimum est de ${fcfa(min)}.`,
        });
      } else if (value > max) {
        ctx.addIssue({
          code: 'custom',
          path: ['other'],
          message: `Le montant maximum est de ${fcfa(max)}.`,
        });
      }
    });

/** Erreur de champ renvoyée par le serveur (enveloppe V1 `{error: {details: {amount: […]}}}`). */
const serverAmountError = (error: unknown): string | null => {
  if (
    !(error instanceof ApiError) ||
    !error.body ||
    typeof error.body !== 'object'
  )
    return null;
  const outer = error.body as Record<string, unknown>;
  const details =
    (outer.error as { details?: Record<string, unknown> } | undefined)
      ?.details ?? outer;
  const messages = details.amount;
  return Array.isArray(messages) && messages.length ? String(messages[0]) : null;
};

const StepTitle = ({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) => (
  <h2 id={id} className="m-0 text-18 font-semibold leading-[26px] text-ink">
    {children}
  </h2>
);

/**
 * Formulaire de don, partagé par l'espace fidèle (WEB-FID-Donner : cartes de fonds, colonne
 * « Votre don » collante) et le parcours sans compte (WEB-Don-Paroisse : une colonne de 640,
 * e-mail facultatif). Aucun champ de paiement : le paiement se fait chez l'agrégateur.
 */
export const DonationForm = ({
  variant,
  data,
  parishCode,
  initialFundId,
  redirectHref,
}: {
  variant: DonationFormVariant;
  data: PublicParish;
  /** Parcours sans compte : code de la paroisse (lien « Réessayer » après un échec). */
  parishCode?: string;
  initialFundId?: string | null;
  redirectHref: (donationId: string) => string;
}) => {
  const router = useRouter();
  const formId = useId();
  const ids = {
    fonds: `${formId}-fonds`,
    montant: `${formId}-montant`,
    options: `${formId}-options`,
  };
  const schema = useMemo(
    () => makeSchema(data.min_amount, data.max_amount),
    [data.min_amount, data.max_amount],
  );
  const defaultFund =
    data.funds.find((f) => f.id === initialFundId)?.id ??
    data.funds[0]?.id ??
    '';
  const defaultPreset =
    data.suggested_amounts[Math.min(2, data.suggested_amounts.length - 1)] ??
    null;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      fund_id: defaultFund,
      preset: defaultPreset,
      other: '',
      fees_covered: false,
      anonymous: false,
      email: '',
    },
  });
  const { register, handleSubmit, setValue, watch, setError, formState } = form;
  const values = watch();

  const checkout = useCreateCheckout();
  const [serverError, setServerError] = useState<string | null>(null);
  // Une clé d'idempotence par intention de don : la même tant que le formulaire ne change pas.
  const intent = useRef<{ signature: string; key: string } | null>(null);

  const fund = data.funds.find((f) => f.id === values.fund_id) ?? null;
  const raw = amountOf(values);
  const value =
    raw !== null &&
    !Number.isNaN(raw) &&
    raw >= data.min_amount &&
    raw <= data.max_amount
      ? raw
      : null;
  const { fee, charged, allocated } = breakdown(
    value ?? 0,
    data.fee_rate_bp,
    values.fees_covered,
  );
  const feePercent = `${(data.fee_rate_bp / 100).toLocaleString('fr-FR')}${NBSP}%`;

  const onSubmit = handleSubmit(async (v) => {
    setServerError(null);
    const body: CheckoutBody = {
      fund_id: v.fund_id,
      amount: amountOf(v)!,
      fees_covered: v.fees_covered,
      anonymous: v.anonymous,
      email: variant === 'public' ? v.email.trim() : '',
    };
    const signature = JSON.stringify(body);
    if (intent.current?.signature !== signature)
      intent.current = { signature, key: newIdempotencyKey() };
    try {
      const result = await checkout.mutateAsync({
        body,
        idempotencyKey: intent.current.key,
      });
      const chosen = data.funds.find((f) => f.id === v.fund_id);
      saveCheckout({
        donation_id: result.donation_id,
        reference: result.reference,
        checkout_url: result.checkout_url,
        amount: result.amount,
        fee_amount: result.fee_amount,
        charged_amount: result.charged_amount,
        net_amount: result.net_amount,
        fund_id: v.fund_id,
        fund_title: chosen?.title ?? '',
        parish_name: data.parish.name,
        parish_code: parishCode,
      });
      router.push(redirectHref(result.donation_id));
    } catch (error) {
      const amountError = serverAmountError(error);
      if (amountError)
        setError('other', { type: 'server', message: amountError });
      else
        setServerError(
          error instanceof Error
            ? error.message
            : 'Le paiement n’a pas pu être préparé. Réessayez dans un instant.',
        );
    }
  });

  const otherError = formState.errors.other?.message;
  const fundError = formState.errors.fund_id?.message;
  const isPublic = variant === 'public';

  const fundsStep = (
    <div
      role="group"
      aria-labelledby={ids.fonds}
      className={isPublic ? undefined : 'px-8 pt-7'}
    >
      <StepTitle id={ids.fonds}>{isPublic ? 'Fonds' : '1. Fonds'}</StepTitle>
      {!isPublic && (
        <p className="m-0 mt-0.5 text-14 text-ink-3">
          {data.funds.length} fonds ouvert{data.funds.length > 1 ? 's' : ''} à{' '}
          {shortParishName(data.parish.name)}.
        </p>
      )}
      <div
        role="radiogroup"
        aria-labelledby={ids.fonds}
        className={cn(
          isPublic
            ? 'mt-3 flex flex-col rounded-12 border border-line bg-paper'
            : 'mt-4 flex flex-col gap-3',
        )}
      >
        {data.funds.map((f) =>
          isPublic ? (
            <FundRow key={f.id} fund={f} {...register('fund_id')} />
          ) : (
            <FundCard
              key={f.id}
              fund={f}
              campaignHref={paths.app.dons.campagne.getHref(f.id)}
              {...register('fund_id')}
            />
          ),
        )}
      </div>
      {fundError && (
        <p role="alert" className="m-0 mt-2 text-13 text-err">
          {fundError}
        </p>
      )}
    </div>
  );

  const amountStep = (
    <div
      role="group"
      aria-labelledby={ids.montant}
      className={isPublic ? 'mt-5' : 'px-8 pt-6'}
    >
      <StepTitle id={ids.montant}>
        {isPublic ? 'Montant' : '2. Montant'}
      </StepTitle>
      <div className={isPublic ? 'mt-3' : 'mt-4'}>
        <AmountPills
          name={`${formId}-preset`}
          amounts={data.suggested_amounts}
          value={values.other.trim() ? null : values.preset}
          onChange={(a) => {
            setValue('preset', a);
            setValue('other', '', {
              shouldValidate: formState.isSubmitted || Boolean(otherError),
            });
          }}
        />
      </div>
      <Field
        id={`${formId}-autre`}
        label="Autre montant"
        error={otherError}
        hint={
          otherError
            ? undefined
            : `Entre ${amount(data.min_amount)} et ${fcfa(data.max_amount)}.`
        }
        className="mt-5 max-w-[300px]"
      >
        <Input
          controlSize="md"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Saisir un montant"
          className="pr-16 tabular-nums"
          trailing={<span className="pr-0.5 text-15 text-ink-3">FCFA</span>}
          {...register('other')}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            setValue('other', digits, {
              shouldValidate: Boolean(otherError) || formState.isSubmitted,
              shouldDirty: true,
            });
          }}
          value={values.other}
        />
      </Field>
    </div>
  );

  const feeLabel = isPublic
    ? `Je couvre les frais (${feePercent})`
    : value === null
      ? 'Je couvre les frais de paiement'
      : `Je couvre les frais de paiement (${fcfa(fee)})`;
  const feeHint = isPublic
    ? 'Sinon, ils sont déduits du montant affecté au fonds.'
    : value === null
      ? 'Sinon, ils sont déduits du don.'
      : `Sinon, ils sont déduits du don${NBSP}: ${fcfa(value - fee)} vont au fonds.`;

  const optionsStep = (
    <div
      role="group"
      aria-labelledby={ids.options}
      className={isPublic ? 'mt-5' : 'px-8 pt-6'}
    >
      <StepTitle id={ids.options}>
        {isPublic ? 'Options' : '3. Options'}
      </StepTitle>
      <div
        className={cn(
          isPublic
            ? 'mt-3.5 grid gap-x-6 gap-y-4 sm:grid-cols-2'
            : 'mt-4 flex flex-col gap-4',
        )}
      >
        <OptionCheckbox
          id={`${formId}-frais`}
          label={feeLabel}
          description={feeHint}
          {...register('fees_covered')}
        />
        <OptionCheckbox
          id={`${formId}-anonyme`}
          label="Don anonyme"
          description="Votre nom n’apparaîtra nulle part, même pour la paroisse."
          {...register('anonymous')}
        />
      </div>
      {isPublic && (
        <Field
          id={`${formId}-email`}
          label="E-mail"
          optional
          error={formState.errors.email?.message}
          hint="Pour recevoir votre reçu (effacé après 90 jours)."
          className="mt-5"
        >
          <Input
            controlSize="md"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.sn"
            {...register('email')}
          />
        </Field>
      )}
    </div>
  );

  const separator = (
    <div
      aria-hidden="true"
      className={cn('h-px bg-line', isPublic ? 'mt-6' : 'mx-8 mt-7')}
    />
  );

  if (isPublic) {
    return (
      <form
        id={formId}
        noValidate
        onSubmit={onSubmit}
        aria-label={`Faire un don à la paroisse ${shortParishName(data.parish.name)}`}
        className="mt-7 rounded-16 border border-line bg-paper p-6 shadow-card sm:p-8"
      >
        {fundsStep}
        {separator}
        {amountStep}
        {separator}
        {optionsStep}
        <div className="mt-6 border-t border-line pt-6">
          <Button type="submit" size="xl" block loading={checkout.isPending}>
            Continuer vers le paiement
          </Button>
          {serverError && (
            <Notice
              tone="err"
              role="alert"
              title={serverError}
              className="mt-3"
            />
          )}
          <PaymentReassurance />
        </div>
      </form>
    );
  }

  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_336px]">
      <form
        id={formId}
        noValidate
        onSubmit={onSubmit}
        aria-label="Faire un don"
        className="min-w-0 rounded-16 border border-line bg-paper pb-8 shadow-card"
      >
        {fundsStep}
        {separator}
        {amountStep}
        {separator}
        {optionsStep}
      </form>
      <DonationSummary
        formId={formId}
        fundTitle={fund?.title ?? null}
        parishName={data.parish.name}
        value={value}
        fee={fee}
        charged={charged}
        allocated={allocated}
        feesCovered={values.fees_covered}
        pending={checkout.isPending}
        error={serverError}
      />
    </div>
  );
};
