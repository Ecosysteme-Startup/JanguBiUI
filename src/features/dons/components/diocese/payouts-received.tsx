import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ScrollRegion } from '@/components/ui/scroll-region';
import { LoadingBlock } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import { usePayouts } from '../../api/export-and-reconciliation';
import type { Payout } from '../../types/schemas';
import { fcfa } from '../../utils/format';

import { dayMonth, PAYOUT_STATE } from './imperee-labels';

const GRID =
  'grid grid-cols-[116px_minmax(0,1fr)_120px_150px] items-center gap-4 px-6';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « Lundi 21 sept. » */
const payoutDate = (iso: string) =>
  capitalize(`${dayjs(iso).format('dddd')} ${dayMonth(iso)}`);

/** Total du mois du dernier reversement reçu (« Total reçu en septembre »). */
const monthTotal = (payouts: Payout[]) => {
  const month = dayjs(payouts[0].paid_at).format('YYYY-MM');
  return {
    label: dayjs(payouts[0].paid_at).format('MMMM'),
    total: payouts
      .filter((p) => dayjs(p.paid_at).format('YYYY-MM') === month)
      .reduce((sum, p) => sum + p.net_amount, 0),
  };
};

/** « Reversements reçus » (WEB-DIO-Quetes-Imperees) : lots de l'agrégateur versés au diocèse, avec leur rapprochement. */
export const PayoutsReceived = ({ nodeId }: { nodeId: string }) => {
  const payouts = usePayouts(nodeId);
  const rows = payouts.data?.results ?? [];
  const month = rows.length > 0 ? monthTotal(rows) : null;
  return (
    <Card
      as="section"
      padding="none"
      aria-labelledby="qi-rev"
      className="overflow-hidden"
    >
      <div className="px-6 pb-4 pt-5">
        <h2 id="qi-rev" className="m-0 text-20 font-semibold">
          Reversements reçus
        </h2>
        <p className="m-0 mt-1 text-15 text-ink-2">
          Versés par l’agrégateur sur le compte du diocèse, tous fonds
          confondus, frais déduits.
        </p>
      </div>
      {payouts.isPending ? (
        <div className="border-t border-line px-6 py-4">
          <LoadingBlock label="Chargement des reversements…" lines={3} />
        </div>
      ) : payouts.isError ? (
        <EmptyState
          tone="err"
          icon="alerte"
          title="Les reversements n’ont pas pu être chargés"
          className="border-t border-line"
        >
          {payouts.error.message}
        </EmptyState>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="portefeuille"
          title="Aucun reversement reçu"
          className="border-t border-line"
        >
          Les reversements de l’agrégateur apparaîtront ici dès le premier lot.
        </EmptyState>
      ) : (
        <ScrollRegion label="Reversements reçus, défilement horizontal">
          <table
            aria-label="Reversements reçus"
            className="block w-full min-w-[520px] border-collapse text-ink"
          >
            <thead className="block">
              <tr
                className={cn(
                  GRID,
                  'h-10 border-t border-line bg-surface text-13 font-medium text-ink-3',
                )}
              >
                <th scope="col" className="text-left font-medium">
                  Référence
                </th>
                <th scope="col" className="text-left font-medium">
                  Date
                </th>
                <th scope="col" className="text-right font-medium">
                  Net reçu
                </th>
                <th scope="col" className="text-left font-medium">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="block">
              {rows.map((p) => {
                const state = PAYOUT_STATE[p.status ?? 'recu'];
                return (
                  <tr
                    key={p.id}
                    className={cn(
                      GRID,
                      'tnum border-t border-line py-3 text-15 hover:bg-surface',
                    )}
                  >
                    <th scope="row" className="text-left font-semibold">
                      {p.external_ref}
                    </th>
                    <td className="flex flex-col">
                      <span className="text-ink-2">
                        {payoutDate(p.paid_at)}
                      </span>
                      {p.status === 'ecart' && p.discrepancy_amount ? (
                        <span className="text-13 text-warn">
                          Écart de {fcfa(p.discrepancy_amount)}
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap text-right">
                      {fcfa(p.net_amount)}
                    </td>
                    <td>
                      <Badge tone={state.tone} dot>
                        {state.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {month && (
              <tfoot className="block">
                <tr className="tnum flex items-baseline justify-between gap-4 border-t border-line bg-surface px-6 py-3 text-14 text-ink-2">
                  <th scope="row" className="text-left font-normal">
                    Total reçu en {month.label}
                  </th>
                  <td className="whitespace-nowrap text-15 font-semibold text-ink">
                    {fcfa(month.total)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </ScrollRegion>
      )}
    </Card>
  );
};
