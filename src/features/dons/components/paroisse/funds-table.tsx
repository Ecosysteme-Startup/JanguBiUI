import NextLink from 'next/link';

import { paths } from '@/config/paths';
import { plural } from '@/utils/plural';

import type { ParishSummary, StaffFund } from '../../types/schemas';
import {
  amount,
  fcfa,
  fundKindLabel,
  progressPercent,
} from '../../utils/format';
import { FundProgress } from '../shared/fund-progress';

import { DataTable, DTd, DTh, FundStatusBadge, KindTag } from './parts';
import { dateRange } from './period';

type Row = {
  id: string;
  title: string;
  kind: string;
  month: number;
  fund: StaffFund | undefined;
};

/** Fonds mouvementés ce mois (synthèse), puis fonds ouverts sans mouvement. */
export const fundRows = (summary: ParishSummary, funds: StaffFund[]): Row[] => {
  const byId = new Map(funds.map((f) => [f.id, f]));
  const moved = summary.by_fund.map((b) => ({
    id: b.fund_id,
    title: b.title,
    kind: b.kind,
    month: b.total,
    fund: byId.get(b.fund_id),
  }));
  const idle = funds
    .filter(
      (f) =>
        f.status === 'ouvert' &&
        !summary.by_fund.some((b) => b.fund_id === f.id),
    )
    .map((f) => ({
      id: f.id,
      title: f.title,
      kind: f.kind,
      month: 0,
      fund: f,
    }));
  return [...moved, ...idle];
};

/** « 4,5 M » : objectif abrégé à côté du réuni. */
const shortGoal = (goal: number) =>
  goal >= 1_000_000
    ? `${String(Math.round(goal / 100_000) / 10).replace('.', ',')}\u00a0M`
    : amount(goal);

const subline = (row: Row) => {
  const f = row.fund;
  if (!f) return null;
  return [
    dateRange(f.starts_on, f.ends_on),
    f.destination === 'curie' ? 'reversée au diocèse' : null,
    f.kind === 'campagne' ? plural(f.donations_count, 'don', 'dons') : null,
  ]
    .filter(Boolean)
    .join(' · ');
};

/** « Par fonds » (WEB-PAR-Dons) : affecté ce mois, total du fonds, avancement d'une campagne, statut. */
export const FundsTable = ({
  nodeId,
  rows,
  canManage,
}: {
  nodeId: string;
  rows: Row[];
  canManage: boolean;
}) => (
  <DataTable label="Par fonds">
    <thead>
      <tr>
        <DTh>Fonds</DTh>
        <DTh className="w-[152px]">Type</DTh>
        <DTh align="right" className="w-[148px]">
          Affecté ce mois
        </DTh>
        <DTh align="right" className="w-[192px]">
          Total du fonds
        </DTh>
        <DTh align="right" className="w-[104px]">
          Statut
        </DTh>
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => {
        const f = row.fund;
        const editable =
          canManage &&
          f &&
          f.node_id === nodeId &&
          f.kind === 'campagne' &&
          f.status !== 'clos';
        const sub = subline(row);
        return (
          <tr key={row.id} className="hover:bg-surface">
            <DTd className="h-15 min-w-[240px]">
              <span className="flex flex-col">
                {editable ? (
                  <NextLink
                    href={paths.espace.dons.campagne.getHref(nodeId, row.id)}
                    className="text-15 font-semibold text-ink hover:text-primary"
                  >
                    {row.title}
                  </NextLink>
                ) : (
                  <span className="text-15 font-semibold text-ink">
                    {row.title}
                  </span>
                )}
                {sub && <span className="tnum text-13 text-ink-3">{sub}</span>}
              </span>
            </DTd>
            <DTd>
              <KindTag>{fundKindLabel(row.kind)}</KindTag>
            </DTd>
            <DTd
              align="right"
              className="tnum whitespace-nowrap text-15 font-semibold"
            >
              {fcfa(row.month)}
            </DTd>
            <DTd align="right" className="tnum whitespace-nowrap text-ink-2">
              {!f ? (
                '—'
              ) : f.kind === 'campagne' && f.goal_amount ? (
                <span className="flex flex-col items-end gap-1.5">
                  <span>
                    {fcfa(f.raised)} sur {shortGoal(f.goal_amount)}
                  </span>
                  <span className="flex items-center justify-end gap-2">
                    <FundProgress
                      raised={f.raised}
                      goal={f.goal_amount}
                      className="w-[120px]"
                    />
                    <span className="text-13 text-ink-3">
                      {progressPercent(f.raised, f.goal_amount)}&nbsp;%
                    </span>
                  </span>
                </span>
              ) : (
                fcfa(f.raised)
              )}
            </DTd>
            <DTd align="right">
              {f && <FundStatusBadge status={f.status} />}
            </DTd>
          </tr>
        );
      })}
    </tbody>
  </DataTable>
);
