'use client';

import { SectionHeading } from '@/components/ui/section-heading';
import { cn } from '@/utils/cn';
import { frenchTypo } from '@/utils/french-typo';

import type { ParishWeek } from '../api/get-parish-week';
import { clockLabel, dayTag, nextOccurrences } from '../utils/schedule';

import { type ParishTab, TabLink } from './tab-link';

/** « Prochaines messes » : les trois prochaines messes de la semaine publiée, la plus proche en teinte. */
export const NextMasses = ({ week, onSelectTab }: { week: ParishWeek | undefined; onSelectTab: (tab: ParishTab) => void }) => {
  const now = new Date();
  const masses = nextOccurrences(week, 'messe', now, 3);
  if (masses.length === 0) return null;

  return (
    <section aria-labelledby="mp-messes">
      <SectionHeading
        id="mp-messes"
        size="md"
        title="Prochaines messes"
        aside={
          <TabLink tab="horaires" onSelect={onSelectTab}>
            Tous les horaires
          </TabLink>
        }
      />
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
        {masses.map((mass, index) => (
          <li
            key={`${mass.date}-${mass.start_time}-${mass.place_id}`}
            className={cn('rounded-16 border p-4', index === 0 ? 'border-tint-200 bg-tint-50' : 'border-line bg-paper')}
          >
            <p className="tnum m-0 flex items-baseline justify-between gap-2">
              <span className="text-20 font-semibold text-ink">{clockLabel(mass.start_time)}</span>
              <span className={cn('text-13', index === 0 ? 'font-medium text-tint-800' : 'text-ink-3')}>{dayTag(mass.date, mass.start_time, now)}</span>
            </p>
            <p className="m-0 mt-2 text-15 font-semibold text-ink">{frenchTypo(mass.note || 'Messe')}</p>
            <p className="m-0 text-14 text-ink-2">{mass.place_name}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};
