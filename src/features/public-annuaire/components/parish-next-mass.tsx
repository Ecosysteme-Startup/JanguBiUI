'use client';

import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { useNodeWeek } from '../api/get-node-week';
import { useNow } from '../hooks/use-parish-now';
import { formatTime, upcomingMasses } from '../utils/schedule';

import { slotTitle } from './mass-slot';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** « Aujourd'hui, 18 h 30 », « Demain, 7 h », « Dimanche 27, 9 h 30 ». */
const whenLabel = (date: string, time: string, today: string) => {
  const diff = dayjs(date).diff(dayjs(today), 'day');
  const day = diff === 0 ? 'Aujourd’hui' : diff === 1 ? 'Demain' : capitalize(dayjs(date).format('dddd D'));
  return `${day}, ${formatTime(time)}`;
};

/**
 * Carte « Prochaine messe » de la fiche (WEB-Fiche-Paroisse) : la prochaine messe, puis les
 * messes des trois jours suivants. Rien tant qu'aucune messe n'est publiée.
 */
export const ParishNextMass = ({ nodeId }: { nodeId: string }) => {
  const now = useNow();
  const { data } = useNodeWeek(nodeId);
  if (!data || !now) return null;
  const masses = upcomingMasses(data.occurrences, now.today, now.time);
  const next = masses[0];
  if (!next) return null;
  const following = [...new Set(masses.map((m) => m.date).filter((d) => d !== next.date))].slice(0, 3);

  return (
    <section aria-label="Prochaine messe" className="rounded-16 border border-line bg-paper p-6 shadow-card">
      <p className="m-0 text-14 text-ink-3">Prochaine messe</p>
      <p className="tnum m-0 mt-1 text-24 font-semibold text-ink">{frenchTypo(whenLabel(next.date, next.start_time, now.today))}</p>
      <p className="m-0 text-15 text-ink-2">
        {slotTitle(next)}, {next.place_name.charAt(0).toLowerCase() + next.place_name.slice(1)}
      </p>
      {following.length > 0 && (
        <dl className="tnum m-0 mt-4 flex flex-col gap-2 border-t border-line pt-4 text-14">
          {following.map((date) => (
            <div key={date} className="flex justify-between gap-4">
              <dt className="text-ink-2">{capitalize(dayjs(date).format('dddd D'))}</dt>
              <dd className="m-0 text-right text-ink">
                {masses
                  .filter((m) => m.date === date)
                  .map((m) => formatTime(m.start_time))
                  .join(', ')}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
};
