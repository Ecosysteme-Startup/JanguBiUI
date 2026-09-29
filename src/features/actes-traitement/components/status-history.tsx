import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

import type { StatusLog } from '../types/processing';
import { historyEntryDot, historyEntryLabel } from '../utils/history';

/** « aujourd'hui, 8:52 », « 23 sept., 11:25 » */
const stamp = (iso: string) => {
  const d = dayjs(iso);
  return `${d.isSame(dayjs(), 'day') ? 'aujourd’hui' : d.format('D MMM')}, ${d.format('H:mm')}`;
};

/** Journal immuable des statuts, du plus récent au plus ancien (frise de la maquette). */
export const StatusHistory = ({ history }: { history: StatusLog[] }) => {
  const entries = [...history].reverse();
  return (
    <section aria-labelledby="d-histo" className="rounded-16 border border-line bg-paper p-5 shadow-card">
      <h2 id="d-histo" className="m-0 text-18 font-semibold text-ink">
        Historique<span className="sr-only"> des statuts</span>
      </h2>
      <ol className="m-0 mt-4 list-none p-0">
        {entries.map((entry, index) => {
          const last = index === entries.length - 1;
          return (
            <li key={`${entry.created_at}-${index}`} className={cn('relative flex gap-3.5', !last && 'pb-[18px]')}>
              {!last && <span aria-hidden="true" className="absolute bottom-[-6px] left-[5px] top-[18px] w-0.5 bg-line" />}
              <span aria-hidden="true" className={cn('relative mt-[5px] size-3 shrink-0 rounded-full ring-[3px] ring-paper', historyEntryDot(entry))} />
              <span className="flex min-w-0 flex-col">
                <span className="text-14 font-semibold text-ink">{historyEntryLabel(entry)}</span>
                <span className="tnum text-13 text-ink-3">
                  {[entry.changed_by_name, stamp(entry.created_at)].filter(Boolean).join(' · ')}
                </span>
                {entry.comment && <span className="mt-1.5 whitespace-pre-line text-13 text-ink-2">« {entry.comment} »</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="m-0 mt-4 text-12 text-ink-3">Horodatage serveur : aucune entrée ne peut être modifiée ni supprimée.</p>
    </section>
  );
};
