'use client';

import NextLink from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Icon, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { LoadingBlock } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { useCan } from '@/lib/can';
import { apiErrorMessage } from '@/utils/api-errors';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { type ExportFile, type Period, useExportDonations, usePayouts, useReconciliation } from '../../api/export-and-reconciliation';
import { useStaffFunds } from '../../api/staff-funds';
import type { Payout, Reconciliation } from '../../types/schemas';
import { fcfa } from '../../utils/format';

import { DonsTopbar } from './dons-topbar';
import { DataTable, DTd, DTh, Panel, PanelTitle, QueryFailure, Req } from './parts';
import { currentMonth, dateRange, monthLabel, monthPeriod } from './period';

const minus = (v: number) => `−\u00a0${fcfa(v)}`;

/** « Septembre 2026 » pour un mois entier, sinon « 1er sept. au 20 sept. ». */
const periodLabel = (p: Period) => {
  const month = p.date_from.slice(0, 7);
  const full = monthPeriod(month);
  return full.date_from === p.date_from && full.date_to === p.date_to ? monthLabel(month) : (dateRange(p.date_from, p.date_to) ?? '');
};

const RecoRow = ({ label, sub, value, strong, className }: { label: string; sub: string; value: string; strong?: boolean; className?: string }) => (
  <div className={cn('flex items-center justify-between gap-4 border-t border-line px-6 py-3', className)}>
    <dt className="flex flex-col">
      <span className={cn('text-15 text-ink', strong ? 'font-semibold' : 'font-medium')}>{label}</span>
      <span className="text-13 text-ink-3">{sub}</span>
    </dt>
    <dd className={cn('tnum m-0 whitespace-nowrap text-15', strong ? 'font-semibold text-ink' : 'font-medium text-ink')}>{value}</dd>
  </div>
);

const ReconciliationPanel = ({ nodeId, period }: { nodeId: string; period: Period }) => {
  const query = useReconciliation(nodeId, period);
  return (
    <Panel labelledBy="export-t-rappro" className="overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-6 pb-3 pt-5">
        <PanelTitle id="export-t-rappro">Rapprochement</PanelTitle>
        <span className="text-13 text-ink-3">{periodLabel(period)}</span>
      </div>
      {query.isPending ? (
        <div className="border-t border-line px-6 py-6">
          <LoadingBlock label="Chargement du rapprochement…" lines={5} />
        </div>
      ) : query.isError ? (
        <div className="border-t border-line">
          <QueryFailure error={query.error} nodeId={nodeId} what="Rapprochement" />
        </div>
      ) : (
        <>
          <dl className="m-0">
            <RecoRow label="Payé en ligne" sub="Dons confirmés chez l’agrégateur" value={fcfa(query.data.online_charged)} />
            <RecoRow label="Frais" sub="Frais de paiement de l’agrégateur" value={minus(query.data.online_fees)} className="[&_dd]:text-ink-2" />
            <RecoRow label="Affecté en ligne" sub="Net affecté aux fonds" value={fcfa(query.data.online_net)} strong />
            <RecoRow label="Espèces" sub="Quêtes en espèces validées" value={fcfa(query.data.cash)} />
            <div aria-hidden="true" className="h-2 border-t border-line bg-surface" />
            <RecoRow label="Reversé (archidiocèse)" sub="Reçu sur le compte de l’archidiocèse" value={fcfa(query.data.paid_out)} className="border-t-0" />
            <RecoRow label="En attente de reversement" sub="Affecté en ligne, pas encore reversé" value={fcfa(query.data.awaiting_payout)} strong />
          </dl>
          <p className="m-0 flex gap-2 border-t border-line px-6 pb-4 pt-3 text-13 text-ink-3">
            <Icon name="info" size={16} className="mt-px shrink-0" />
            <span>Les espèces sont déposées par la paroisse&nbsp;; elles n’entrent pas dans les reversements de l’agrégateur.</span>
          </p>
        </>
      )}
    </Panel>
  );
};

type Issue = Reconciliation['issues'][number];

const ISSUE_ICON: Record<Issue['kind'], { icon: IconName; box: string }> = {
  paiement_en_attente: { icon: 'horloge', box: 'bg-warn-bg text-warn' },
  quete_non_validee: { icon: 'especes', box: 'bg-warn-bg text-warn' },
  reversement_ecart: { icon: 'diocese', box: 'bg-err-bg text-err' },
};

const issueView = (issue: Issue, nodeId: string, payouts: Payout[], canCash: boolean) => {
  const day = dayjs(issue.date);
  if (issue.kind === 'paiement_en_attente')
    return {
      title: 'Paiement en attente depuis plus de 24 h',
      sub: `${issue.reference} · depuis le ${day.format('D MMM')}`,
      amount: null,
      note: null,
      action: { label: 'Voir les opérations', href: paths.espace.dons.root.getHref(nodeId, day.format('YYYY-MM')) },
    };
  if (issue.kind === 'quete_non_validee')
    return {
      title: `Quête non validée du ${day.format('dddd D MMMM')}`,
      sub: `${issue.reference} · non comptée dans les espèces`,
      amount: null,
      note: null,
      action: canCash ? { label: 'Valider la saisie', href: paths.espace.dons.quetes.getHref(nodeId) } : null,
    };
  const payout = payouts.find((p) => p.external_ref === issue.reference);
  return {
    title: `Écart sur le reversement ${issue.reference}`,
    sub: `Reçu le ${day.format('D MMM')} sur le compte de l’archidiocèse${payout ? ` · net reçu ${fcfa(payout.net_amount)}` : ''}`,
    amount: payout?.discrepancy_amount ? minus(payout.discrepancy_amount) : null,
    note: payout?.discrepancy_amount ? 'Écart' : null,
    action: { label: 'Voir le reversement', href: paths.espace.dons.export.getHref(nodeId, 'reversements') },
  };
};

const IssuesPanel = ({ nodeId, period, payouts, canCash }: { nodeId: string; period: Period; payouts: Payout[]; canCash: boolean }) => {
  const query = useReconciliation(nodeId, period);
  const issues = query.data?.issues ?? [];
  return (
    <Panel labelledBy="export-t-ecarts" className="mt-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 pb-4 pt-5">
        <div className="flex items-center gap-2.5">
          <PanelTitle id="export-t-ecarts">Écarts signalés</PanelTitle>
          {issues.length > 0 && (
            <span className="inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-full bg-warn-bg px-1.5 text-12 font-semibold text-warn">
              {issues.length}
            </span>
          )}
        </div>
        <span className="text-13 text-ink-3">À traiter avant la clôture du mois</span>
      </div>
      {query.isPending ? (
        <div className="border-t border-line px-6 py-6">
          <LoadingBlock label="Chargement des écarts…" />
        </div>
      ) : query.isError ? (
        <div className="border-t border-line">
          <QueryFailure error={query.error} nodeId={nodeId} what="Écarts" />
        </div>
      ) : issues.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState icon="succes" title="Aucun écart sur la période">
            Paiements, quêtes et reversements concordent.
          </EmptyState>
        </div>
      ) : (
        <ul className="m-0 list-none p-0">
          {issues.map((issue) => {
            const v = issueView(issue, nodeId, payouts, canCash);
            return (
              <li
                key={`${issue.kind}-${issue.reference}`}
                className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-4 border-t border-line px-6 py-4 md:grid-cols-[36px_minmax(0,1fr)_150px_auto]"
              >
                <span className={cn('inline-flex size-9 items-center justify-center rounded-10', ISSUE_ICON[issue.kind].box)}>
                  <Icon name={ISSUE_ICON[issue.kind].icon} size={18} />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-15 font-semibold text-ink">{v.title}</span>
                  <span className="tnum text-13 text-ink-3">{v.sub}</span>
                </span>
                <span className="col-start-2 flex flex-col md:col-start-auto md:items-end">
                  {v.amount && <span className="tnum whitespace-nowrap text-15 font-semibold">{v.amount}</span>}
                  {v.note && <span className="text-13 text-ink-3">{v.note}</span>}
                </span>
                <span className="col-start-2 flex md:col-start-auto md:justify-end">
                  {v.action && (
                    <NextLink href={v.action.href} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-9 px-3.5')}>
                      {v.action.label}
                      <span className="sr-only">, {issue.reference}</span>
                    </NextLink>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
};

const PAYOUT_STATUS = {
  recu: { label: 'Reçu', tone: 'neutral' },
  rapproche: { label: 'Rapproché', tone: 'ok' },
  ecart: { label: 'Écart', tone: 'err' },
} as const;

const PayoutsPanel = ({ nodeId, query }: { nodeId: string; query: ReturnType<typeof usePayouts> }) => (
  <Panel id="reversements" labelledBy="export-t-reversements" className="mt-6 scroll-mt-6 overflow-hidden">
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-6 pb-4 pt-5">
      <PanelTitle id="export-t-reversements">Reversements</PanelTitle>
      <span className="text-13 text-ink-3">Versés par l’agrégateur sur le compte de l’archidiocèse</span>
    </div>
    {query.isPending ? (
      <div className="border-t border-line px-6 py-6">
        <LoadingBlock label="Chargement des reversements…" />
      </div>
    ) : query.isError ? (
      <div className="border-t border-line">
        <QueryFailure error={query.error} nodeId={nodeId} what="Reversements" />
      </div>
    ) : query.data.results.length === 0 ? (
      <div className="border-t border-line">
        <EmptyState icon="diocese" title="Aucun reversement reçu">
          Les reversements de l’agrégateur apparaîtront ici dès leur réception.
        </EmptyState>
      </div>
    ) : (
      <DataTable label="Reversements">
        <thead>
          <tr>
            <DTh>Référence</DTh>
            <DTh>Reçu le</DTh>
            <DTh align="right">Brut</DTh>
            <DTh align="right">Frais</DTh>
            <DTh align="right">Net</DTh>
            <DTh className="w-[180px]">Statut</DTh>
          </tr>
        </thead>
        <tbody>
          {query.data.results.map((p) => {
            const s = PAYOUT_STATUS[p.status ?? 'recu'];
            return (
              <tr key={p.id} className="hover:bg-surface">
                <DTd className="tnum h-12 whitespace-nowrap">{p.external_ref}</DTd>
                <DTd className="tnum whitespace-nowrap text-ink-2">{dayjs(p.paid_at).format('D MMM YYYY')}</DTd>
                <DTd align="right" className="tnum whitespace-nowrap text-ink-2">
                  {fcfa(p.gross_amount)}
                </DTd>
                <DTd align="right" className="tnum whitespace-nowrap text-ink-2">
                  {p.fee_amount !== undefined ? minus(p.fee_amount) : '—'}
                </DTd>
                <DTd align="right" className="tnum whitespace-nowrap font-semibold">
                  {fcfa(p.net_amount)}
                </DTd>
                <DTd>
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <Badge tone={s.tone} dot>
                      {s.label}
                    </Badge>
                    {p.status === 'ecart' && p.discrepancy_amount ? <span className="tnum text-13 text-ink-3">{minus(p.discrepancy_amount)}</span> : null}
                  </span>
                </DTd>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    )}
  </Panel>
);

/** WEB-PAR-Dons-Export : export comptable (journalisé), rapprochement, écarts et reversements. */
export const ExportScreen = ({ nodeId }: { nodeId: string }) => {
  const [period, setPeriod] = useState<Period>(() => monthPeriod(currentMonth()));
  const [fund, setFund] = useState('');
  const [file, setFile] = useState<ExportFile>('csv');
  const funds = useStaffFunds(nodeId);
  const payouts = usePayouts(nodeId);
  const exportMutation = useExportDonations();
  const canCash = useCan('dons.saisir_quete', nodeId);
  const invalid = !period.date_from || !period.date_to || period.date_to < period.date_from;
  const shownPeriod = invalid ? monthPeriod(currentMonth()) : period;

  const onExport = () => {
    if (invalid) return;
    exportMutation.mutate(
      { nodeId, period, fund: fund || undefined, file },
      { onSuccess: () => toast.ok(`Export ${file === 'xlsx' ? 'Excel' : 'CSV'} téléchargé.`) },
    );
  };

  return (
    <div className="flex flex-col">
      <DonsTopbar nodeId={nodeId} current="Exporter et rapprocher" />
      <PageHeader compact title="Exporter et rapprocher" description="Le relevé du mois pour la comptabilité de la paroisse et de l’archidiocèse." />
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
        <Panel labelledBy="export-t-form" className="overflow-hidden">
          <div className="flex flex-col gap-5 p-6">
            <PanelTitle id="export-t-form">Exporter les opérations</PanelTitle>
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <Field id="export-du" label={<Req>Du</Req>} required>
                <Input
                  controlSize="sm"
                  type="date"
                  icon="calendrier"
                  className="tnum"
                  value={period.date_from}
                  onChange={(e) => setPeriod((p) => ({ ...p, date_from: e.target.value }))}
                />
              </Field>
              <Field id="export-au" label={<Req>Au</Req>} required error={invalid && period.date_from && period.date_to ? 'La fin doit suivre le début.' : undefined}>
                <Input
                  controlSize="sm"
                  type="date"
                  icon="calendrier"
                  className="tnum"
                  value={period.date_to}
                  onChange={(e) => setPeriod((p) => ({ ...p, date_to: e.target.value }))}
                />
              </Field>
            </div>
            <Field id="export-fonds" label="Fonds">
              <Select controlSize="sm" value={fund} onChange={(e) => setFund(e.target.value)}>
                <option value="">Tous les fonds{funds.data ? ` (${funds.data.length})` : ''}</option>
                {funds.data?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex flex-col gap-2">
              <span id="export-format" className="text-14 font-medium text-ink">
                Format
              </span>
              <div role="group" aria-labelledby="export-format" className="flex gap-2">
                {(
                  [
                    ['csv', 'CSV'],
                    ['xlsx', 'Excel'],
                  ] as const
                ).map(([value, label]) => (
                  <Chip key={value} pressed={file === value} onClick={() => setFile(value)}>
                    {file === value && <Icon name="check" size={16} strokeWidth={2.25} />}
                    {label}
                  </Chip>
                ))}
              </div>
            </div>
            {exportMutation.isError && (
              <Notice tone="err" role="alert" title="L’export a échoué">
                {apiErrorMessage(exportMutation.error)}
              </Notice>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-surface px-6 py-4">
            <p className="m-0 flex items-center gap-2 text-13 text-ink-3">
              <Icon name="historique" size={16} className="shrink-0" />
              L’export est inscrit au journal d’audit.
            </p>
            <Button className="h-11 px-5" loading={exportMutation.isPending} disabled={invalid} onClick={onExport}>
              {!exportMutation.isPending && <Icon name="import" size={18} />}
              Exporter
            </Button>
          </div>
        </Panel>
        <ReconciliationPanel nodeId={nodeId} period={shownPeriod} />
      </div>
      <IssuesPanel nodeId={nodeId} period={shownPeriod} payouts={payouts.data?.results ?? []} canCash={canCash} />
      <PayoutsPanel nodeId={nodeId} query={payouts} />
    </div>
  );
};
