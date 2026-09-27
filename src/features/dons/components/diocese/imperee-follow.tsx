import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { ScrollRegion } from '@/components/ui/scroll-region';
import { LoadingBlock } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';

import { useImpereeFollow } from '../../api/imperees';
import type { Imperee, ImpereeFollowRow } from '../../types/schemas';
import { amount, fcfa } from '../../utils/format';

import { dayMonth, NOT_OPEN } from './imperee-labels';

const GRID =
  'grid grid-cols-[minmax(0,1fr)_76px_84px_44px_124px] items-center gap-3 px-6';

const PARISH_STATUS: Record<string, string> = {
  ouvert: 'Collecte en cours',
  clos: 'Collecte close',
  brouillon: 'Pas encore publiée',
};

/** « Au lundi 28 sept., 9 h » : heure de la dernière lecture des totaux. */
const asOf = (timestamp: number) => {
  const d = dayjs(timestamp);
  return `Au ${d.format('dddd')} ${dayMonth(d.format('YYYY-MM-DD'))}, ${hour(d)}`;
};

const Row = ({ row }: { row: ImpereeFollowRow }) =>
  row.status === NOT_OPEN ? (
    <tr className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-line px-6 py-3 text-15">
      <th scope="row" className="text-left font-semibold">
        {row.parish}
      </th>
      <td colSpan={4} className="text-right text-14 text-ink-3">
        Collecte non ouverte sur Jàngu Bi
      </td>
    </tr>
  ) : (
    <tr className={cn(GRID, 'tnum border-t border-line py-3 text-15')}>
      <th scope="row" className="flex min-w-0 flex-col text-left font-normal">
        <span className="font-semibold">{row.parish}</span>
        {PARISH_STATUS[row.status] && (
          <span className="text-13 text-ink-3">
            {PARISH_STATUS[row.status]}
          </span>
        )}
      </th>
      <td className="whitespace-nowrap text-right">{amount(row.online)}</td>
      <td className="whitespace-nowrap text-right">{amount(row.cash)}</td>
      <td className="text-right">{row.count}</td>
      <td className="whitespace-nowrap text-right font-semibold">
        {fcfa(row.total)}
      </td>
    </tr>
  );

/**
 * Suivi d'une quête impérée par paroisse (WEB-DIO-Quetes-Imperees) : agrégats seulement
 * (en ligne, espèces, nombre de dons, total), jamais de donnée nominative.
 */
export const ImpereeFollow = ({ imperee }: { imperee: Imperee }) => {
  const follow = useImpereeFollow(imperee.id);
  const headingId = 'qi-suivi';
  return (
    <Card
      as="section"
      padding="none"
      aria-labelledby={headingId}
      className="overflow-hidden"
    >
      <div className="px-6 pb-4 pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h2 id={headingId} className="m-0 text-20 font-semibold">
            {imperee.title}, par paroisse
          </h2>
          {follow.isSuccess && (
            <span className="whitespace-nowrap text-13 text-ink-3">
              {asOf(follow.dataUpdatedAt)}
            </span>
          )}
        </div>
        <p className="m-0 mt-1 text-15 text-ink-2">
          Espèces comptées aux messes et dons en ligne
          {imperee.ends_on
            ? ` jusqu’au ${dayjs(imperee.ends_on).format('D MMMM').replace(/^1 /, '1er ')}`
            : ''}
          . Toute la quête est reversée à la curie.
        </p>
      </div>
      {follow.isPending ? (
        <div className="border-t border-line px-6 py-4">
          <LoadingBlock label="Chargement du suivi…" lines={3} />
        </div>
      ) : follow.isError ? (
        <EmptyState
          tone="err"
          icon="alerte"
          title="Le suivi n’a pas pu être chargé"
          className="border-t border-line"
        >
          {follow.error.message}
        </EmptyState>
      ) : follow.data.length === 0 ? (
        <EmptyState
          icon="paroisse"
          title="Aucune paroisse concernée"
          className="border-t border-line"
        />
      ) : (
        <ScrollRegion label="Suivi par paroisse, défilement horizontal">
          <table
            aria-label={`Suivi de ${imperee.title}, par paroisse`}
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
                  Paroisse
                </th>
                <th scope="col" className="text-right font-medium">
                  En ligne
                </th>
                <th scope="col" className="text-right font-medium">
                  Espèces
                </th>
                <th scope="col" className="text-right font-medium">
                  Dons
                </th>
                <th scope="col" className="text-right font-medium">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="block">
              {follow.data.map((row) => (
                <Row key={row.parish_id} row={row} />
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      )}
      <p className="m-0 flex gap-2 border-t border-line px-6 py-3 text-13 text-ink-3">
        <Icon name="cadenas" size={16} className="mt-px shrink-0" />
        <span>
          Aucune donnée nominative à ce niveau. Les paroisses en préparation
          collectent en espèces, hors Jàngu Bi.
        </span>
      </p>
    </Card>
  );
};
