import NextLink from 'next/link';
import * as React from 'react';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

import type { PublicFund } from '../../types/schemas';
import { ACCEPTED_METHODS, fcfa, progressPercent } from '../../utils/format';
import { FundProgress } from '../shared/fund-progress';

import { fundLine, fundLineCompact } from './fund-labels';

const NBSP = ' ';

type RadioInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
>;

/** Radio 22 px (maquette) : anneau lineField, choisi b600 2 px et pastille 10 px ; natif pour le clavier. */
export const RadioDot = React.forwardRef<HTMLInputElement, RadioInputProps>(
  ({ className, ...props }, ref) => (
    <span
      className={cn('relative mt-px inline-flex size-5.5 shrink-0', className)}
    >
      <input
        ref={ref}
        type="radio"
        className="peer size-5.5 shrink-0 cursor-pointer appearance-none rounded-full border border-line-field bg-paper checked:border-2 checked:border-primary focus-visible:outline-none"
        {...props}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1.5 top-1.5 hidden size-2.5 rounded-full bg-primary peer-checked:block"
      />
    </span>
  ),
);
RadioDot.displayName = 'RadioDot';

/** « Reversée au diocèse » : quête impérée (destination curie). */
const CurieBadge = () => (
  <span className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full bg-surface-2 px-2.5 text-12 font-semibold text-ink-2">
    Reversée au diocèse
  </span>
);

/** Carte radio d'un fonds (WEB-FID-Donner) : choisie = b600 2 px sur b50, campagne avec son avancement. */
export const FundCard = React.forwardRef<
  HTMLInputElement,
  RadioInputProps & { fund: PublicFund; campaignHref?: string }
>(({ fund, campaignHref, ...props }, ref) => {
  const id = `fonds-${fund.id}`;
  const isCampaign = fund.kind === 'campagne' && Boolean(fund.goal_amount);
  return (
    <div
      className={cn(
        'rounded-12 border border-line bg-paper p-[17px] transition-colors hover:border-line-field hover:bg-surface',
        'has-[:checked]:border-2 has-[:checked]:border-primary has-[:checked]:bg-tint-50 has-[:checked]:p-4',
        'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
      )}
    >
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3.5">
        <RadioDot ref={ref} id={id} value={fund.id} {...props} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-start justify-between gap-3">
            <span className="text-16 font-semibold text-ink">{fund.title}</span>
            {fund.destination === 'curie' && <CurieBadge />}
          </span>
          <span className="text-14 text-ink-2">{fundLine(fund)}</span>
        </span>
      </label>
      {isCampaign && (
        <div className="ml-9 mt-3">
          <FundProgress raised={fund.raised} goal={fund.goal_amount} />
          <div className="mt-2 flex items-baseline justify-between gap-3 text-13 tabular-nums text-ink-2">
            <span>
              <span className="font-semibold text-ink">
                {fcfa(fund.raised)}
              </span>{' '}
              réunis sur {fcfa(fund.goal_amount!)} ·{' '}
              {progressPercent(fund.raised, fund.goal_amount)}
              {NBSP}%
            </span>
            {campaignHref && (
              <NextLink
                href={campaignHref}
                className="whitespace-nowrap text-14 font-semibold"
              >
                Voir la campagne
              </NextLink>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
FundCard.displayName = 'FundCard';

/** Rangée radio compacte d'un fonds (WEB-Don-Paroisse), dans une liste encadrée. */
export const FundRow = React.forwardRef<
  HTMLInputElement,
  RadioInputProps & { fund: PublicFund }
>(({ fund, ...props }, ref) => {
  const id = `fonds-${fund.id}`;
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-3.5 border-t border-line px-4 py-3 first:rounded-t-12 first:border-t-0 last:rounded-b-12 hover:bg-surface',
        'has-[:checked]:bg-tint-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-primary',
      )}
    >
      <RadioDot ref={ref} id={id} value={fund.id} {...props} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-15 font-semibold leading-6 text-ink">
          {fund.title}
        </span>
        <span className="text-13 tabular-nums text-ink-2">
          {fundLineCompact(fund)}
        </span>
      </span>
      {fund.destination === 'curie' && <CurieBadge />}
    </label>
  );
});
FundRow.displayName = 'FundRow';

/** Pilules de montant (radio) : 44 px, choisie b50 / b600 / b800 avec coche. */
export const AmountPills = ({
  amounts,
  value,
  onChange,
  name,
}: {
  amounts: number[];
  value: number | null;
  onChange: (value: number) => void;
  name: string;
}) => (
  <div role="radiogroup" aria-label="Montant" className="flex flex-wrap gap-2">
    {amounts.map((a) => {
      const checked = value === a;
      return (
        <label
          key={a}
          className={cn(
            'inline-flex h-11 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-[18px] text-15 tabular-nums transition-colors',
            'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
            checked
              ? 'border-primary bg-tint-50 font-semibold text-tint-800'
              : 'border-line bg-paper text-ink hover:border-line-field hover:bg-surface',
          )}
        >
          <input
            type="radio"
            name={name}
            value={a}
            checked={checked}
            onChange={() => onChange(a)}
            className="sr-only"
          />
          {checked && <Icon name="check" size={16} strokeWidth={2} />}
          {fcfa(a)}
        </label>
      );
    })}
  </div>
);

/** Case 22 px (maquette) avec libellé 15/500 et aide 13 ink3. */
export const OptionCheckbox = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
    label: React.ReactNode;
    description: React.ReactNode;
  }
>(({ id, label, description, ...props }, ref) => (
  <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
    <span className="relative mt-px inline-flex size-5.5 shrink-0">
      <input
        ref={ref}
        id={id}
        type="checkbox"
        aria-labelledby={`${id}-libelle`}
        aria-describedby={`${id}-aide`}
        className="peer size-5.5 shrink-0 cursor-pointer appearance-none rounded-6 border-1.5 border-line-field bg-paper checked:border-primary-fill checked:bg-primary-fill"
        {...props}
      />
      <Icon
        name="check"
        size={16}
        strokeWidth={3}
        className="pointer-events-none absolute left-[3px] top-[3px] hidden text-on-primary peer-checked:block"
      />
    </span>
    <span className="flex flex-col">
      <span id={`${id}-libelle`} className="text-15 font-medium leading-6 text-ink">
        {label}
      </span>
      <span id={`${id}-aide`} className="text-13 text-ink-3">
        {description}
      </span>
    </span>
  </label>
));
OptionCheckbox.displayName = 'OptionCheckbox';

/** Réassurance sous le bouton de paiement : prestataire agréé, aucune donnée de paiement, moyens en pilules texte. */
export const PaymentReassurance = () => (
  <>
    <p className="m-0 mt-3.5 flex items-start gap-2 text-13 text-ink-3">
      <Icon name="cadenas" size={14} className="mt-0.5 shrink-0" />
      <span>
        Paiement sécurisé chez un prestataire agréé BCEAO. Jàngu Bi ne conserve
        aucune donnée de paiement.
      </span>
    </p>
    <ul
      aria-label="Moyens acceptés sur la page de paiement"
      className="m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0"
    >
      {ACCEPTED_METHODS.map((m) => (
        <li
          key={m}
          className="inline-flex h-[26px] items-center whitespace-nowrap rounded-full border border-line bg-paper px-2.5 text-12 font-medium text-ink-2"
        >
          {m}
        </li>
      ))}
    </ul>
  </>
);
