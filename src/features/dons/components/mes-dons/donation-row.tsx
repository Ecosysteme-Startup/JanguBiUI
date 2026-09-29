'use client';

import { useId } from 'react';

import { Icon } from '@/components/ui/icon';
import { toast } from '@/components/ui/toast';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { useDownloadReceipt } from '../../api/download-receipt';
import type { MyDonation } from '../../types/schemas';
import { fcfa, fundKindLabel } from '../../utils/format';
import { DonationStatusBadge } from '../shared/donation-status-badge';

/** Colonnes de la table-cartes (WEB-FID-Mes-Dons) : date, fonds, paroisse, montant, statut, anonymat, reçu. */
export const DONATIONS_GRID =
  'xl:grid-cols-[84px_minmax(0,1fr)_150px_112px_120px_24px_84px] xl:gap-x-4 xl:items-center';

const UNAVAILABLE = 'Disponible une fois le don confirmé';
/** Montant barré : le don n'a pas abouti ou a été rendu. */
const STRUCK = new Set(['echoue', 'expire', 'rembourse']);

const receiptClasses =
  'hit inline-flex h-[34px] items-center gap-1.5 rounded-10 border border-line px-3 text-14 font-semibold';

const ReceiptAction = ({
  donation,
  label,
}: {
  donation: MyDonation;
  label: string;
}) => {
  const descriptionId = useId();
  const download = useDownloadReceipt();
  const available =
    donation.status === 'confirme' && donation.receipt_available;

  if (!available) {
    return (
      <Tooltip content={UNAVAILABLE}>
        <button
          type="button"
          aria-disabled="true"
          aria-label={label}
          aria-describedby={descriptionId}
          className={cn(
            receiptClasses,
            'cursor-not-allowed bg-surface text-ink-3',
          )}
        >
          <Icon name="import" size={15} />
          Reçu
          <span id={descriptionId} className="sr-only">
            {UNAVAILABLE}
          </span>
        </button>
      </Tooltip>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      aria-busy={download.isPending || undefined}
      disabled={download.isPending}
      onClick={() =>
        download.mutate(
          { donationId: donation.id, receiptNumber: donation.receipt_number },
          {
            onError: () =>
              toast.err(
                'Le reçu n’a pas pu être téléchargé. Réessayez dans un instant.',
              ),
          },
        )
      }
      className={cn(
        receiptClasses,
        'bg-paper text-ink hover:border-line-field hover:bg-surface disabled:cursor-wait',
      )}
    >
      <Icon
        name={download.isPending ? 'chargement' : 'import'}
        size={15}
        className={download.isPending ? 'animate-jb-spin' : undefined}
      />
      Reçu
    </button>
  );
};

/** Une ligne de la table-cartes : grille à 7 colonnes dès 1280 px, carte empilée en dessous. */
export const DonationRow = ({
  donation,
  first = false,
}: {
  donation: MyDonation;
  first?: boolean;
}) => {
  const date = dayjs(donation.created_at ?? donation.confirmed_at ?? undefined);
  const day = donation.created_at ? date.format('D MMM') : '—';
  const struck = STRUCK.has(donation.status ?? '');
  return (
    <div
      role="row"
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 border-line px-5 py-3 xl:grid xl:min-h-16 xl:py-2.5',
        DONATIONS_GRID,
        first ? 'xl:border-t' : 'border-t',
      )}
    >
      <span
        role="cell"
        className="tnum order-2 whitespace-nowrap text-14 text-ink-2 xl:order-none"
      >
        {day}
      </span>
      <span
        role="cell"
        className="order-1 flex min-w-0 basis-full flex-col xl:order-none xl:basis-auto"
      >
        <span className="truncate text-15 font-semibold leading-[22px]">
          {donation.fund.title}
        </span>
        <span className="text-13 text-ink-3">
          {fundKindLabel(donation.fund.kind)}
        </span>
      </span>
      <span
        role="cell"
        className="order-2 whitespace-nowrap text-14 text-ink-2 xl:order-none"
      >
        {donation.parish}
      </span>
      <span
        role="cell"
        className={cn(
          'tnum order-3 whitespace-nowrap text-15 font-semibold xl:order-none xl:text-right',
          struck && 'text-ink-3 line-through',
        )}
      >
        {fcfa(donation.amount)}
      </span>
      <span role="cell" className="order-3 xl:order-none">
        <DonationStatusBadge status={donation.status} />
      </span>
      <span
        role="cell"
        className="order-3 inline-flex text-ink-3 xl:order-none"
      >
        {donation.anonymous && (
          <Icon name="oeil-barre" size={18} label="Don anonyme" />
        )}
      </span>
      <span
        role="cell"
        className="order-4 ml-auto flex justify-end xl:order-none xl:ml-0"
      >
        <ReceiptAction
          donation={donation}
          label={`Reçu du don du ${day}, ${donation.fund.title}`}
        />
      </span>
    </div>
  );
};
