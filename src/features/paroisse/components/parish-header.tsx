'use client';

import { useQuery } from '@tanstack/react-query';

import { nodeAncestorsQueryOptions } from '@/hooks/use-node-ancestors';
import { cn } from '@/utils/cn';

import { useParish } from '../api/get-parish';
import { useParishWeek } from '../api/get-parish-week';
import { whenLabel } from '../utils/day-label';
import { nextOccurrence, rangeLabel } from '../utils/schedule';

/** Nom en deux temps : « Saint-<em>Dominique</em> » (dernier mot en italique bleu, comme la maquette). */
const SplitName = ({ name }: { name: string }) => {
  const cut = Math.max(name.lastIndexOf('-'), name.lastIndexOf(' '));
  if (cut <= 0) return <>{name}</>;
  return (
    <>
      {name.slice(0, cut + 1)}
      <em className="text-primary">{name.slice(cut + 1)}</em>
    </>
  );
};

export const ParishHeader = ({ nodeId, name, className }: { nodeId: string; name: string; className?: string }) => {
  const { data: parish } = useParish(nodeId);
  const { data: ancestors } = useQuery(nodeAncestorsQueryOptions(nodeId));
  const { data: week } = useParishWeek(nodeId);
  const now = new Date();
  const mass = nextOccurrence(week, 'messe', now);
  const confession = nextOccurrence(week, 'confession', now);
  const diocese = ancestors?.at(-1)?.name;
  const locality = [parish?.address, parish?.city].filter(Boolean).join(', ');
  const subtitle = [locality, ...(ancestors ?? []).slice(-2).map((a) => a.name)].filter(Boolean).join(' · ');

  return (
    <header className={className}>
      <p className="tnum m-0 text-meta text-ink-3">
        <span className="text-primary">02</span> — Ma paroisse · paroisse suivie{diocese ? ` · ${diocese}` : ''}
      </p>
      <h1 aria-label={name} className="m-0 mt-3 font-serif text-title font-normal text-ink lg:text-h1">
        <SplitName name={name} />
      </h1>
      {subtitle && <p className="m-0 mt-3 text-body text-ink-2">{subtitle}</p>}
      {(mass || confession) && (
        <dl className={cn('m-0 mt-6 grid gap-4 border-t border-line pt-4 sm:grid-cols-2')}>
          {mass && (
            <div>
              <dt className="tnum text-meta text-ink-3">Prochaine messe</dt>
              <dd className="m-0 mt-1 font-serif text-h4 text-ink first-letter:uppercase">{whenLabel(mass.date, mass.start_time, now)}</dd>
            </div>
          )}
          {confession && (
            <div>
              <dt className="tnum text-meta text-ink-3">Confessions</dt>
              <dd className="m-0 mt-1 font-serif text-h4 text-ink first-letter:uppercase">
                {whenLabel(confession.date, confession.start_time, now).split(',')[0]}, {rangeLabel(confession)}
              </dd>
            </div>
          )}
        </dl>
      )}
    </header>
  );
};
