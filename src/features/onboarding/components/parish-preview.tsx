'use client';

import NextLink from 'next/link';
import { useEffect, useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import type { DirectoryParish } from '../api/get-directory';
import { type PreviewOccurrence, usePreviewAnnouncement, usePreviewWeek } from '../api/get-parish-preview';

const shortName = (name: string) => name.replace(/^Paroisse\s+/i, '');

/** Prochaines messes (à partir de maintenant), deux au plus. */
const nextMasses = (occurrences: PreviewOccurrence[], today: string, now: string) =>
  occurrences
    .filter((o) => o.kind === 'messe' && (o.date > today || (o.date === today && o.start_time.slice(0, 5) >= now)))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
    .slice(0, 2);

const when = (o: PreviewOccurrence, today: string) =>
  o.date === today ? (o.start_time >= '17:00' ? 'ce soir' : 'aujourd’hui') : dayjs(o.date).format('ddd D');

const Slot = ({ occurrence, today, first }: { occurrence: PreviewOccurrence; today: string; first: boolean }) => (
  <div className={cn('flex gap-3.5 rounded-12 border px-3.5 py-3', first ? 'border-line-active bg-tint-50' : 'border-line')}>
    <div className="tnum w-13 shrink-0">
      <div className="text-15 font-semibold text-ink">{occurrence.start_time.slice(0, 5)}</div>
      <div className="text-12 text-ink-2">{when(occurrence, today)}</div>
    </div>
    <div aria-hidden="true" className={cn('w-px', first ? 'bg-line-active' : 'bg-line')} />
    <div className="min-w-0">
      <div className="text-15 font-semibold text-ink">{occurrence.note ? `Messe ${occurrence.note.replace(/^messe\s+/i, '')}` : 'Messe'}</div>
      <div className="text-13 text-ink-2">{occurrence.place_name}</div>
    </div>
  </div>
);

/**
 * Panneau « Ce que vous recevrez de … » (WEB-Inscription-Paroisse) : prochaines messes et
 * dernière annonce de la paroisse choisie, données réelles de sa fiche publique.
 */
export const ParishPreview = ({ parish }: { parish: DirectoryParish | null }) => {
  const [now, setNow] = useState<{ today: string; time: string } | null>(null);
  useEffect(() => setNow({ today: dayjs().format('YYYY-MM-DD'), time: dayjs().format('HH:mm') }), []);
  const active = parish?.is_active_on_platform ? parish.id : undefined;
  const week = usePreviewWeek(active);
  const announcement = usePreviewAnnouncement(active);
  const masses = week.data && now ? nextMasses(week.data.occurrences, now.today, now.time) : [];

  return (
    <aside aria-labelledby="apercu-titre" className="self-start rounded-16 border border-line bg-surface p-6 lg:p-10">
      <h2 id="apercu-titre" className="m-0 text-20 font-semibold text-ink">
        {parish ? `Ce que vous recevrez de ${shortName(parish.name)}` : 'Ce que vous recevrez de votre paroisse'}
      </h2>
      <p className="m-0 mt-1 text-15 text-ink-2">
        {parish && !parish.is_active_on_platform
          ? 'Ses coordonnées dès maintenant, puis ses horaires et ses annonces dès son arrivée sur Jàngu Bi.'
          : 'Sur votre page d’accueil, dès la création du compte.'}
      </p>
      {masses.length > 0 && now && (
        <div className="mt-6 rounded-16 border border-line bg-paper p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <span className="text-16 font-semibold text-ink">Prochaines messes</span>
            <span className="text-13 text-ink-3">{dayjs(now.today).format('dddd D MMMM').replace(/^./, (c) => c.toUpperCase())}</span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {masses.map((mass, index) => (
              <Slot key={`${mass.date}-${mass.start_time}`} occurrence={mass} today={now.today} first={index === 0} />
            ))}
          </div>
        </div>
      )}
      {announcement.data && (
        <div className="mt-3 rounded-16 border border-line bg-paper p-5 shadow-card">
          <div className="flex items-center gap-1.5 text-13 font-medium text-primary-strong">
            <Icon name="annonce" size={14} />
            Dernière annonce
          </div>
          <div className="mt-1 text-16 font-semibold text-ink">{frenchTypo(announcement.data.title)}</div>
          {announcement.data.excerpt && <div className="text-14 text-ink-2">{frenchTypo(announcement.data.excerpt)}</div>}
        </div>
      )}
      {!parish && (
        <p className="m-0 mt-6 rounded-16 border border-line bg-paper p-5 text-14 text-ink-2">
          Choisissez une paroisse pour voir ses prochaines messes et sa dernière annonce.{' '}
          <NextLink href={paths.paroisses.list.getHref()} className="font-semibold">
            Parcourir l&apos;annuaire
          </NextLink>
        </p>
      )}
      <p className="m-0 mt-5 flex gap-2 text-13 text-ink-3">
        <Icon name="info" size={16} className="shrink-0" />
        Suivre une paroisse n&apos;a pas d&apos;effet sur vos demandes d&apos;actes, qui vont toujours à la paroisse du sacrement.
      </p>
    </aside>
  );
};
