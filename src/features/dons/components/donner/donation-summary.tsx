import NextLink from 'next/link';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { paths } from '@/config/paths';
import { parishLabel } from '@/utils/parish-name';

import { fcfa } from '../../utils/format';

import { PaymentReassurance } from './donation-controls';

const NBSP = ' ';
const MINUS = '−';

/**
 * Colonne collante « Votre don » (WEB-FID-Donner) : fonds, don, frais estimés (déduits ou
 * ajoutés), montant affecté, bouton de paiement relié au formulaire par `form`.
 */
export const DonationSummary = ({
  formId,
  fundTitle,
  parishName,
  value,
  fee,
  charged,
  allocated,
  feesCovered,
  pending,
  error,
}: {
  formId: string;
  fundTitle: string | null;
  parishName: string;
  /** `null` : montant absent ou hors bornes. */
  value: number | null;
  fee: number;
  charged: number;
  allocated: number;
  feesCovered: boolean;
  pending: boolean;
  error: string | null;
}) => (
  <aside
    aria-labelledby="recap-titre"
    className="flex flex-col gap-4 lg:sticky lg:top-6"
  >
    <div className="rounded-16 border border-line bg-surface p-6">
      <h2
        id="recap-titre"
        className="m-0 text-18 font-semibold leading-[26px] text-ink"
      >
        Votre don
      </h2>
      <dl className="m-0 mt-4 flex flex-col tabular-nums">
        <div className="border-t border-line py-3">
          <dt className="text-13 text-ink-3">Fonds</dt>
          <dd className="m-0 mt-0.5 text-15 font-semibold text-ink">
            {fundTitle ?? '—'}
          </dd>
          <dd className="m-0 text-14 text-ink-2">{parishLabel(parishName)}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-line py-3 text-15">
          <dt className="text-ink-2">Don</dt>
          <dd className="m-0 font-semibold text-ink">
            {value === null ? '—' : fcfa(value)}
          </dd>
        </div>
        <div className="flex justify-between gap-3 pb-3 text-15">
          <dt className="text-ink-2">
            Frais estimés
            <span className="block text-13 text-ink-3">
              {feesCovered ? 'à votre charge' : 'déduits du don'}
            </span>
          </dt>
          <dd className="m-0 text-ink">
            {value === null
              ? '—'
              : `${feesCovered ? '+' : MINUS}${NBSP}${fcfa(fee)}`}
          </dd>
        </div>
        {feesCovered && (
          <div className="flex justify-between gap-3 border-t border-line py-3 text-15">
            <dt className="text-ink-2">Vous payez</dt>
            <dd className="m-0 font-semibold text-ink">
              {value === null ? '—' : fcfa(charged)}
            </dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
          <dt className="text-15 font-semibold text-ink">Affecté au fonds</dt>
          <dd className="m-0 text-20 font-semibold text-ink">
            {value === null ? '—' : fcfa(allocated)}
          </dd>
        </div>
      </dl>
      <Button
        type="submit"
        form={formId}
        size="xl"
        block
        loading={pending}
        className="mt-5"
      >
        Continuer vers le paiement
      </Button>
      {error && (
        <Notice tone="err" role="alert" title={error} className="mt-3" />
      )}
      <PaymentReassurance />
    </div>

    <NextLink
      href={paths.app.dons.historique.getHref()}
      className="flex items-center gap-3 rounded-16 border border-line bg-paper px-5 py-4 text-ink no-underline transition-colors hover:border-line-active hover:text-ink"
    >
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-10 bg-tint-50 text-primary">
        <Icon name="recu" size={18} />
      </span>
      <span className="flex flex-1 flex-col">
        <span className="text-15 font-semibold">Mes dons</span>
        <span className="text-13 text-ink-3">
          Historique et reçus, visibles par vous seul.
        </span>
      </span>
      <Icon name="chevron-droite" size={18} className="text-ink-3" />
    </NextLink>
  </aside>
);
