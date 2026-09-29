'use client';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import { useNodeWeek } from '../api/get-node-week';
import { usePublicAnnouncements } from '../api/get-public-announcements';
import { useActiveParish, useNow } from '../hooks/use-parish-now';
import { slotWhen } from '../utils/schedule';

import { MassSlot } from './mass-slot';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Aperçu « Votre paroisse » (WEB-Accueil, « Ce que vous pouvez faire ») : la semaine de la
 * paroisse pilote, les messes du jour et sa dernière annonce. Illustration non interactive.
 */
export const ParishWeekPreview = () => {
  const parish = useActiveParish();
  const now = useNow();
  const week = useNodeWeek(parish?.id ?? '');
  const announcements = usePublicAnnouncements({ nodeId: parish?.id, limit: 1 });
  if (!parish || !week.data || !now) return null;

  const days = Array.from({ length: 7 }, (_, i) => dayjs(week.data.start).add(i, 'day').format('YYYY-MM-DD'));
  const busy = new Set(week.data.occurrences.map((o) => o.date));
  // Messes du premier jour qui en a (aujourd'hui en général), la prochaine mise en avant.
  const firstDay = days.find((d) => week.data.occurrences.some((o) => o.date === d && o.kind === 'messe'));
  const slots = week.data.occurrences
    .filter((o) => o.date === firstDay && o.kind === 'messe')
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .slice(0, 2);
  const nextIndex = slots.findIndex((o) => slotWhen(o, now.today, now.time) !== 'passée');
  const announcement = announcements.data?.results[0];

  return (
    <div className="rounded-16 border border-line bg-paper p-5 shadow-card md:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-17 font-semibold text-ink">Horaires, {parish.name.replace(/^Paroisse\s+/i, '')}</span>
        <span className="text-13 text-ink-3">{capitalize(dayjs(week.data.start).format('MMMM YYYY'))}</span>
      </div>
      <div className="tnum mt-4 grid grid-cols-7 gap-1 text-center">
        {days.map((date) => {
          const today = date === now.today;
          return (
            <span key={date} className={cn('flex flex-col items-center gap-0.5 rounded-12 pb-2.5 pt-2', today ? 'bg-tint-100 text-tint-800' : 'text-ink-2')}>
              <span className={cn('text-12', today && 'font-medium')}>{dayjs(date).format('ddd')}</span>
              <span className={cn('text-17', today ? 'font-bold' : 'font-semibold text-ink')}>{dayjs(date).format('D')}</span>
              <span className={cn('size-[5px] rounded-full', busy.has(date) ? (today ? 'bg-primary-fill' : 'bg-tint-300') : 'bg-transparent')} />
            </span>
          );
        })}
      </div>
      {slots.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {slots.map((slot, index) => {
            const when = slotWhen(slot, now.today, now.time);
            return (
              <MassSlot
                key={`${slot.start_time}-${slot.place_id}`}
                occurrence={slot}
                when={when}
                tone={when === 'passée' ? 'past' : index === nextIndex ? 'next' : 'default'}
              />
            );
          })}
        </div>
      )}
      {announcement && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="flex items-center gap-1.5 text-12 font-medium text-primary-strong">
            <Icon name="annonce" size={14} />
            Dernière annonce
          </div>
          <div className="mt-1 text-15 font-semibold text-ink">{frenchTypo(announcement.title)}</div>
        </div>
      )}
    </div>
  );
};
