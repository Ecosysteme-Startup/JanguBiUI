import NextLink from 'next/link';

import { MYSTERIES_BY_DAY } from '@/features/chapelet/utils/rosary';
import { cn } from '@/utils/cn';

import { chapeletHref } from '../utils/links';

/**
 * « Les mystères selon les jours » (FID-Chapelet) : la ligne d'aujourd'hui en évidence ; chaque groupe
 * de mystères se prie aussi un autre jour.
 */
export const DaysTable = ({ today, praying }: { today: number; praying: string }) => (
  <section aria-labelledby="chapelet-jours" className="rounded-16 border border-line bg-surface p-5">
    <h2 id="chapelet-jours" className="m-0 text-16 font-semibold text-ink">
      Les mystères selon les jours
    </h2>
    <dl className="m-0 mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 text-14">
      {MYSTERIES_BY_DAY.map((row) => {
        const isToday = row.weekdays.includes(today);
        const isPraying = row.group.toLowerCase() === praying.toLowerCase();
        return (
          <div key={row.group} className="contents">
            <dt className={cn(isToday ? 'font-semibold text-tint-800' : 'text-ink-2')}>
              {row.days}
              {isToday && (row.weekdays.length === 1 ? ', aujourd’hui' : ' (aujourd’hui)')}
            </dt>
            <dd className="m-0">
              {isPraying ? (
                <span className={cn(isToday ? 'font-semibold text-tint-800' : 'font-semibold text-ink')}>{row.group}</span>
              ) : (
                <NextLink
                  href={chapeletHref(isToday ? null : row.weekdays[0])}
                  aria-label={`Prier les mystères ${row.group.toLowerCase()}`}
                  className={cn('hit', isToday ? 'font-semibold text-tint-800' : 'text-ink hover:text-primary')}
                >
                  {row.group}
                </NextLink>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
    <p className="m-0 mt-4 text-13 text-ink-3">Touchez un groupe de mystères pour le prier aujourd’hui.</p>
  </section>
);
