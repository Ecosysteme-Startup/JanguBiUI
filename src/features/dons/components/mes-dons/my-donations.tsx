'use client';

import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import {
  MY_DONATIONS_PAGE_SIZE,
  useMyDonations,
} from '../../api/get-my-donations';
import { useMySummary } from '../../api/get-my-summary';

import {
  type KindFilter,
  KindFilters,
  matchesKind,
  YearSelect,
} from './donation-filters';
import { DonationRow, DONATIONS_GRID } from './donation-row';
import { DonorSummaryBar } from './donor-summary-bar';

/** Année demandée par `?annee=` (bornée), sinon l'année en cours. */
const useYear = () => {
  const raw = Number(useSearchParams().get('annee'));
  return Number.isInteger(raw) && raw >= 2000 && raw <= 2100
    ? raw
    : dayjs().year();
};

const TableSkeleton = () => (
  <div role="status" className="flex flex-col gap-2 p-5">
    <span className="sr-only">Chargement de vos dons…</span>
    {[0, 1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-12 rounded-12" />
    ))}
  </div>
);

/** WEB-FID-Mes-Dons : total de l'année, filtres par type de fonds et par année, table-cartes, reçus. */
export const MyDonations = () => {
  const router = useRouter();
  const year = useYear();
  const [kind, setKind] = useState<KindFilter>('tous');
  const [page, setPage] = useState(1);
  const summary = useMySummary(year);
  const donations = useMyDonations({ year, page });

  const all = donations.data?.results ?? [];
  const rows = all.filter((d) => matchesKind(d.fund.kind, kind));

  const changeYear = (next: number) => {
    setPage(1);
    router.replace(paths.app.dons.historique.getHref(next));
  };

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div>
          <h1 className="m-0 text-28 font-semibold tracking-[-0.01em] text-ink sm:text-32">
            Mes dons
          </h1>
          <p className="m-0 mt-2 text-16 text-ink-2">
            Vos dons en ligne, leur statut et vos reçus.
          </p>
        </div>
        <NextLink
          href={paths.app.dons.root.getHref()}
          className={cn(
            buttonVariants({ size: 'lg' }),
            'self-start whitespace-nowrap hover:no-underline sm:self-auto',
          )}
        >
          <Icon name="plus" size={20} />
          Nouveau don
        </NextLink>
      </header>

      <DonorSummaryBar
        year={year}
        summary={summary.data}
        isPending={summary.isPending}
        className="mt-6"
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <KindFilters value={kind} onChange={setKind} />
        <YearSelect year={year} onChange={changeYear} />
      </div>

      <div
        role="table"
        aria-label={`Mes dons en ${year}`}
        aria-busy={donations.isFetching || undefined}
        className="mt-4 rounded-16 border border-line bg-paper text-ink shadow-card"
      >
        <div role="rowgroup">
          <div
            role="row"
            className={cn(
              DONATIONS_GRID,
              'hidden h-10 rounded-t-16 bg-surface px-5 text-13 font-medium text-ink-3 xl:grid',
            )}
          >
            <span role="columnheader">Date</span>
            <span role="columnheader">Fonds</span>
            <span role="columnheader">Paroisse</span>
            <span role="columnheader" className="text-right">
              Montant
            </span>
            <span role="columnheader">Statut</span>
            <span role="columnheader">
              <span className="sr-only">Anonymat</span>
            </span>
            <span role="columnheader" className="text-right">
              Reçu
            </span>
          </div>
        </div>
        <div role="rowgroup" aria-live="polite">
          {donations.isPending ? (
            <div role="row">
              <div role="cell">
                <TableSkeleton />
              </div>
            </div>
          ) : donations.isError ? (
            <div role="row">
              <div role="cell" className="border-t border-line p-5">
                <EmptyState
                  tone="err"
                  icon="alerte"
                  title="Vos dons n’ont pas pu être chargés."
                  action={
                    <button
                      type="button"
                      className={buttonVariants({
                        variant: 'secondary',
                        size: 'sm',
                      })}
                      onClick={() => donations.refetch()}
                    >
                      Réessayer
                    </button>
                  }
                />
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div role="row">
              <div
                role="cell"
                className="border-t border-line p-5 xl:border-t-0"
              >
                <EmptyState
                  icon="don"
                  title={
                    all.length === 0
                      ? `Aucun don en ${year}.`
                      : 'Aucun don de ce type.'
                  }
                >
                  {all.length === 0
                    ? 'Vos dons en ligne apparaîtront ici, avec leur statut et leur reçu.'
                    : undefined}
                </EmptyState>
              </div>
            </div>
          ) : (
            rows.map((d, index) => (
              <DonationRow key={d.id} donation={d} first={index === 0} />
            ))
          )}
        </div>
      </div>

      {donations.data && donations.data.count > MY_DONATIONS_PAGE_SIZE && (
        <Pagination
          offset={(page - 1) * MY_DONATIONS_PAGE_SIZE}
          limit={MY_DONATIONS_PAGE_SIZE}
          total={donations.data.count}
          noun="dons"
          nounPosition="after"
          onChange={(offset) => setPage(offset / MY_DONATIONS_PAGE_SIZE + 1)}
          className="mt-4"
        />
      )}

      <div className="mt-4 flex flex-col gap-2 text-13 text-ink-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="oeil-barre" size={14} className="shrink-0" />
          Don anonyme&nbsp;: votre nom n’est transmis à personne, même à la
          paroisse.
        </span>
        <span>Reçus simples, ce ne sont pas des reçus fiscaux.</span>
      </div>
    </>
  );
};
