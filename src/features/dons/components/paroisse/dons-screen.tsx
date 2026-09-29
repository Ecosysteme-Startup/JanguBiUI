'use client';

import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, useState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useCan, useContexts } from '@/lib/can';
import { cn } from '@/utils/cn';
import { plural } from '@/utils/plural';

import { useReconciliation } from '../../api/export-and-reconciliation';
import { useParishSummary } from '../../api/get-parish-summary';
import { useStaffFunds } from '../../api/staff-funds';
import type { ParishSummary } from '../../types/schemas';
import { amount, fcfa, paymentMethodLabel } from '../../utils/format';

import { FundsTable, fundRows } from './funds-table';
import { OperationsTable } from './operations-table';
import { Panel, PanelTitle, QueryFailure } from './parts';
import {
  monthLabel,
  monthName,
  monthOrCurrent,
  monthPeriod,
  recentMonths,
} from './period';
import { SundayChart, sundayBars } from './sunday-chart';

const MonthSelect = ({
  month,
  onChange,
}: {
  month: string;
  onChange: (m: string) => void;
}) => {
  const months = recentMonths(12);
  const options = months.includes(month) ? months : [month, ...months];
  return (
    <div className="relative">
      <label htmlFor="dons-mois" className="sr-only">
        Mois affiché
      </label>
      <Icon
        name="calendrier"
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-ink-2"
      />
      <select
        id="dons-mois"
        value={month}
        onChange={(e) => onChange(e.target.value)}
        className="hit h-11 cursor-pointer appearance-none rounded-12 border border-line bg-paper pl-11 pr-10 text-14 font-medium text-ink hover:border-line-field hover:bg-surface"
      >
        {options.map((m) => (
          <option key={m} value={m}>
            {monthLabel(m)}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-bas"
        size={16}
        className="pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2 text-ink-3"
      />
    </div>
  );
};

const CompactAlert = ({
  tone,
  icon,
  children,
  action,
}: {
  tone: 'warn' | 'info';
  icon: 'horloge' | 'especes';
  children: ReactNode;
  action: ReactNode;
}) => (
  <div
    className={cn(
      'flex items-center gap-2.5 rounded-12 px-3.5 py-2.5 text-14',
      tone === 'warn' ? 'bg-warn-bg text-warn' : 'bg-tint-50 text-tint-900',
    )}
  >
    <Icon name={icon} size={18} className="shrink-0" />
    <span className="flex-1">{children}</span>
    {action}
  </div>
);

const MethodsPanel = ({
  summary,
  month,
}: {
  summary: ParishSummary;
  month: string;
}) => {
  const rows = [...summary.by_method].sort(
    (a, b) => Number(a.method === 'especes') - Number(b.method === 'especes'),
  );
  const share = (v: number) =>
    summary.total ? Math.round((v * 100) / summary.total) : 0;
  return (
    <Panel labelledBy="dons-t-moyen" className="px-6 pb-3 pt-5">
      <div className="flex items-baseline justify-between gap-4">
        <PanelTitle id="dons-t-moyen">Par moyen</PanelTitle>
        <span className="text-13 capitalize text-ink-3">
          {monthName(month)}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="m-0 mt-3 border-t border-line py-3 text-14 text-ink-3">
          Aucun paiement ce mois-ci.
        </p>
      ) : (
        <ul className="m-0 mt-3 list-none p-0">
          {rows.map((m) => (
            <li
              key={m.method}
              className="flex items-baseline justify-between gap-3 border-t border-line py-3"
            >
              <span className="flex flex-col">
                <span className="text-14 font-medium text-ink">
                  {paymentMethodLabel(m.method)}
                </span>
                <span className="tnum text-13 text-ink-3">
                  {m.method === 'especes'
                    ? plural(m.count, 'quête saisie', 'quêtes saisies')
                    : plural(m.count, 'don', 'dons')}{' '}
                  · {share(m.total)}&nbsp;%
                </span>
              </span>
              <span className="tnum whitespace-nowrap text-15 font-semibold">
                {fcfa(m.total)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="m-0 mt-1 border-t border-line pt-3 text-13 text-ink-3">
        Moyens en ligne proposés chez l’agrégateur&nbsp;: Wave, Orange Money,
        Free Money, carte.
      </p>
    </Panel>
  );
};

/** WEB-PAR-Dons : synthèse du mois en texte, graphique par dimanche, fonds, moyens, opérations. */
export const DonsScreen = ({ nodeId }: { nodeId: string }) => {
  const router = useRouter();
  const params = useSearchParams();
  const month = monthOrCurrent(params.get('mois'));
  const period = monthPeriod(month);
  const canManage = useCan('dons.gerer_fonds', nodeId);
  const canCash = useCan('dons.saisir_quete', nodeId);
  const canExport = useCan('dons.exporter', nodeId);
  const { contexts } = useContexts();
  const parish = contexts.find((c) => c.nodeId === nodeId)?.name;

  const summary = useParishSummary(nodeId, month);
  const funds = useStaffFunds(nodeId);
  const reconciliation = useReconciliation(nodeId, period);
  const [opsStatus, setOpsStatus] = useState<string | undefined>(undefined);

  const showPending = () => {
    setOpsStatus('en_attente');
    document
      .getElementById('dons-operations')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        compact
        title="Dons et quêtes"
        description={`Dons en ligne et quêtes en espèces${parish ? ` de ${parish}` : ''}.`}
        actions={
          <>
            <MonthSelect
              month={month}
              onChange={(m) =>
                router.replace(paths.espace.dons.root.getHref(nodeId, m))
              }
            />
            {canManage && (
              <NextLink
                href={paths.espace.dons.nouvelleCampagne.getHref(nodeId)}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'h-11 text-14',
                )}
              >
                <Icon name="plus" size={18} className="text-ink-2" />
                Nouvelle campagne
              </NextLink>
            )}
            {canCash && (
              <NextLink
                href={paths.espace.dons.quetes.getHref(nodeId)}
                className={cn(
                  buttonVariants({ variant: 'primary' }),
                  'h-11 px-5',
                )}
              >
                <Icon name="especes" size={18} />
                Saisir une quête
              </NextLink>
            )}
          </>
        }
      />

      {summary.isPending ? (
        <div className="mt-7">
          <LoadingBlock label="Chargement de la synthèse…" lines={4} />
        </div>
      ) : summary.isError ? (
        <div className="mt-7">
          <QueryFailure
            error={summary.error}
            nodeId={nodeId}
            what="Dons et quêtes"
          />
        </div>
      ) : (
        <>
          <section
            aria-label="Synthèse du mois"
            className="mt-7 grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_400px]"
          >
            <p className="m-0 text-18 text-ink">
              <strong className="tnum font-semibold">
                {fcfa(summary.data.total)}
              </strong>{' '}
              affectés en {monthName(month)}, dont{' '}
              <span className="tnum">{amount(summary.data.online)}</span> en
              ligne et <span className="tnum">{amount(summary.data.cash)}</span>{' '}
              en espèces.{' '}
              <span className="text-ink-2">
                Frais de paiement&nbsp;: {fcfa(summary.data.fees)}.
              </span>
            </p>
            {(summary.data.pending_count > 0 ||
              summary.data.cash_to_validate > 0) && (
              <div className="flex flex-col gap-2">
                {summary.data.pending_count > 0 && (
                  <CompactAlert
                    tone="warn"
                    icon="horloge"
                    action={
                      <button
                        type="button"
                        onClick={showPending}
                        className="hit whitespace-nowrap font-semibold text-warn hover:underline"
                      >
                        Voir
                        <span className="sr-only">
                          {' '}
                          les paiements en attente
                        </span>
                      </button>
                    }
                  >
                    {plural(
                      summary.data.pending_count,
                      'paiement',
                      'paiements',
                    )}{' '}
                    en attente de confirmation
                  </CompactAlert>
                )}
                {summary.data.cash_to_validate > 0 && (
                  <CompactAlert
                    tone="info"
                    icon="especes"
                    action={
                      <NextLink
                        href={paths.espace.dons.quetes.getHref(nodeId)}
                        className="hit whitespace-nowrap font-semibold text-tint-800 hover:underline"
                      >
                        Valider
                        <span className="sr-only"> les quêtes en espèces</span>
                      </NextLink>
                    }
                  >
                    {plural(
                      summary.data.cash_to_validate,
                      'quête en espèces',
                      'quêtes en espèces',
                    )}{' '}
                    à valider
                  </CompactAlert>
                )}
              </div>
            )}
          </section>

          <div className="mt-6 grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Panel labelledBy="dons-t-chart" className="px-6 pb-6 pt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <PanelTitle id="dons-t-chart">Montants par dimanche</PanelTitle>
                <span className="text-13 text-ink-3">
                  Semaine terminée le dimanche · FCFA
                </span>
              </div>
              <div className="mt-3">
                {summary.data.daily.length === 0 ? (
                  <p className="m-0 py-10 text-center text-14 text-ink-3">
                    Aucun montant affecté ce mois-ci.
                  </p>
                ) : (
                  <SundayChart
                    bars={sundayBars(summary.data.daily)}
                    title={`Montants affectés par dimanche, ${monthLabel(month).toLowerCase()}`}
                  />
                )}
              </div>
              <p className="m-0 mt-2 text-13 text-ink-3">
                Seules les quêtes en espèces validées sont comptées.
              </p>
            </Panel>
            <MethodsPanel summary={summary.data} month={month} />
          </div>

          <Panel labelledBy="dons-t-fonds" className="mt-6 overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-6 pb-4 pt-5">
              <PanelTitle id="dons-t-fonds">Par fonds</PanelTitle>
              {canManage && (
                <NextLink
                  href={paths.espace.dons.nouvelleCampagne.getHref(nodeId)}
                  className="text-14 font-semibold text-primary hover:text-primary-strong"
                >
                  Créer une campagne
                </NextLink>
              )}
            </div>
            {funds.isPending ? (
              <div className="border-t border-line px-6 py-6">
                <LoadingBlock label="Chargement des fonds…" />
              </div>
            ) : funds.isError ? (
              <div className="border-t border-line">
                <QueryFailure
                  error={funds.error}
                  nodeId={nodeId}
                  what="Fonds"
                />
              </div>
            ) : (
              <FundsTable
                nodeId={nodeId}
                rows={fundRows(summary.data, funds.data)}
                canManage={canManage}
              />
            )}
          </Panel>
        </>
      )}

      <Panel
        id="dons-operations"
        labelledBy="dons-t-ops"
        className="mt-6 scroll-mt-6 overflow-hidden"
      >
        <div className="flex items-center justify-between gap-4 px-6 pb-4 pt-5">
          <PanelTitle id="dons-t-ops">Dernières opérations</PanelTitle>
          {canExport && (
            <NextLink
              href={paths.espace.dons.export.getHref(nodeId)}
              className="inline-flex items-center gap-1.5 text-14 font-semibold text-primary hover:text-primary-strong"
            >
              <Icon name="import" size={16} />
              Exporter et rapprocher
            </NextLink>
          )}
        </div>
        <OperationsTable
          key={`${month}-${opsStatus ?? ''}`}
          nodeId={nodeId}
          period={period}
          status={opsStatus}
          onClearStatus={() => setOpsStatus(undefined)}
          canRefund={canManage}
        />
      </Panel>

      {reconciliation.data && (
        <Notice
          icon="diocese"
          role="status"
          className="mt-6"
          title={
            <>
              <strong className="font-semibold">Reversements.</strong> Les
              reversements de l’agrégateur arrivent sur le compte de
              l’archidiocèse. Montant affecté à la paroisse en{' '}
              {monthName(month)}&nbsp;:{' '}
              <span className="tnum">
                {fcfa(reconciliation.data.online_net)}
              </span>
              , dont{' '}
              <span className="tnum">
                {amount(reconciliation.data.paid_out)}
              </span>{' '}
              déjà reversés.{' '}
              {canExport && (
                <NextLink
                  href={paths.espace.dons.export.getHref(nodeId)}
                  className="font-semibold text-tint-800 underline"
                >
                  Voir le rapprochement
                </NextLink>
              )}
            </>
          }
        />
      )}
    </div>
  );
};
