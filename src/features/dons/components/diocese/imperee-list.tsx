import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { plural } from '@/utils/plural';

import type { Imperee } from '../../types/schemas';
import { fcfa } from '../../utils/format';

import { impereeState, periodLabel } from './imperee-labels';

const GRID =
  'grid grid-cols-[minmax(0,1fr)_104px_124px] items-center gap-4 px-6';

/** « Quêtes de l'année pastorale » : une rangée par quête, la sélection ouvre son suivi. */
export const ImpereeList = ({
  imperees,
  selectedId,
  onSelect,
}: {
  imperees: Imperee[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) => (
  <Card
    as="section"
    padding="none"
    aria-labelledby="qi-liste"
    className="overflow-hidden"
  >
    <div className="flex items-baseline justify-between gap-4 px-6 pb-4 pt-5">
      <h2 id="qi-liste" className="m-0 text-20 font-semibold">
        Quêtes de l’année pastorale
      </h2>
      <span className="tnum text-13 text-ink-3">
        {plural(imperees.length, 'quête', 'quêtes')}
      </span>
    </div>
    <div
      aria-hidden="true"
      className={cn(
        GRID,
        'h-10 border-t border-line bg-surface text-13 font-medium text-ink-3',
      )}
    >
      <span>Quête</span>
      <span>Statut</span>
      <span className="text-right">Total</span>
    </div>
    <ul aria-label="Quêtes impérées" className="m-0 list-none p-0">
      {imperees.map((q) => {
        const state = impereeState(q);
        const selected = q.id === selectedId;
        const period = periodLabel(q.starts_on, q.ends_on);
        return (
          <li key={q.id} className="border-t border-line">
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(q.id)}
              className={cn(
                GRID,
                'w-full py-3 text-left text-ink transition-colors focus-visible:relative',
                selected
                  ? 'bg-tint-50 ring-1 ring-inset ring-line-active'
                  : 'hover:bg-surface',
              )}
            >
              <span className="flex min-w-0 flex-col">
                <span
                  className={cn(
                    'text-15 font-semibold',
                    selected && 'text-tint-800',
                  )}
                >
                  {q.title}
                </span>
                <span
                  className={cn(
                    'text-13',
                    selected ? 'text-ink-2' : 'text-ink-3',
                  )}
                >
                  {period}
                  {period && q.authorization_ref ? ' · ' : ''}
                  {q.authorization_ref && (
                    <span className="tnum whitespace-nowrap">
                      {q.authorization_ref}
                    </span>
                  )}
                </span>
              </span>
              <span>
                <Badge tone={state.tone} dot={!state.icon} icon={state.icon}>
                  {state.label}
                </Badge>
              </span>
              {q.raised > 0 ? (
                <span className="tnum whitespace-nowrap text-right text-15 font-semibold">
                  {fcfa(q.raised)}
                </span>
              ) : (
                <span className="text-right text-15 text-ink-3">
                  <span aria-hidden="true">—</span>
                  <span className="sr-only">Aucun don</span>
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  </Card>
);
