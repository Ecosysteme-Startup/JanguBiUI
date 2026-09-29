'use client';

import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';
import { plural } from '@/utils/plural';

import type { GlanceSlot } from '../api/get-next-confessions';

const DAY = 'YYYY-MM-DD';
const clock = (iso: string) => dayjs(iso).format('HH:mm');

/** Prochain jour ouvert (aujourd'hui compris) et ses créneaux. */
export const nextConfessionDay = (slots: GlanceSlot[], now = dayjs()) => {
  const upcoming = slots.filter((s) => s.status !== 'bloque' && dayjs(s.ends_at).isAfter(now)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const first = upcoming[0];
  if (!first) return null;
  const day = dayjs(first.starts_at).format(DAY);
  const ofDay = slots.filter((s) => dayjs(s.starts_at).format(DAY) === day);
  const starts = ofDay.map((s) => clock(s.starts_at)).sort();
  const ends = ofDay.map((s) => clock(s.ends_at)).sort();
  return {
    day,
    slots: ofDay,
    range: `${starts[0]} – ${ends[ends.length - 1]}`,
    booked: ofDay.filter((s) => s.status === 'reserve').length,
    free: ofDay.filter((s) => s.status === 'libre').length,
    places: [...new Set(ofDay.map((s) => s.place.name))],
  };
};
export type ConfessionDay = NonNullable<ReturnType<typeof nextConfessionDay>>;

/** « Abbé Robert Sagna » → « Abbé Sagna » (colonne étroite de l'aperçu). */
export const shortPriest = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return parts.length > 2 && /^(abbé|père|mgr|frère|diacre)$/i.test(parts[0]) ? `${parts[0]} ${parts[parts.length - 1]}` : name;
};

/** « Samedi 26 sept., 16:00 – 18:00 » */
export const confessionDayLine = (d: ConfessionDay) => {
  const label = dayjs(d.day).format('dddd D MMM');
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}, ${d.range}`;
};

/**
 * Aperçu du prochain jour de confessions (maquette PAR-Tableau-de-bord) : une rangée par prêtre,
 * une case par créneau (réservé ou libre). Aucun nom de pénitent n'est lu ni affiché.
 */
export const ConfessionsGlance = ({ nodeId, day }: { nodeId: string; day: ConfessionDay | null }) => {
  const columns = day ? [...new Set(day.slots.map((s) => clock(s.starts_at)))].sort() : [];
  const priests = day ? [...new Map(day.slots.map((s) => [s.priest_id, s.priest_name])).entries()].sort((a, b) => a[1].localeCompare(b[1])) : [];
  // Une heure affichée toutes les `step` colonnes (quatre repères au plus, comme la maquette).
  const step = Math.max(1, Math.ceil(columns.length / 4));
  const template = { gridTemplateColumns: `84px repeat(${columns.length}, minmax(0, 1fr))` };
  const isToday = day ? dayjs(day.day).isSame(dayjs(), 'day') : false;
  const title = !day ? 'Confessions' : isToday ? 'Confessions d’aujourd’hui' : `Confessions de ${dayjs(day.day).format('dddd')}`;
  return (
    <section aria-labelledby="tb-conf" className="rounded-16 border border-line bg-paper px-6 pb-6 pt-5 shadow-card">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="tb-conf" className="m-0 text-18 font-semibold text-ink">
          {title}
        </h2>
        <NextLink href={paths.espace.confessions.getHref(nodeId)} className="text-14 font-semibold hover:underline" aria-label="Ouvrir le planning des confessions">
          Ouvrir
        </NextLink>
      </div>
      {!day ? (
        <p className="m-0 mt-2 text-14 text-ink-2">Aucun créneau ouvert pour les prochains jours.</p>
      ) : (
        <>
          <p className="tnum m-0 mt-0.5 text-14 text-ink-2">
            {confessionDayLine(day)} · {day.places.join(', ')}
          </p>
          <div className="mt-4 flex flex-col gap-1.5" aria-hidden="true">
            <div className="tnum grid gap-1 text-12 text-ink-3" style={template}>
              <span />
              {columns
                .filter((_, i) => i % step === 0)
                .map((time) => (
                  <span key={time} className="truncate" style={{ gridColumn: `span ${step}` }}>
                    {time}
                  </span>
                ))}
            </div>
            {priests.map(([id, name]) => (
              <div key={id} className="grid items-center gap-1" style={template}>
                <span className="truncate text-13 font-medium text-ink" title={name}>
                  {shortPriest(name)}
                </span>
                {columns.map((time) => {
                  const slot = day.slots.find((s) => s.priest_id === id && clock(s.starts_at) === time);
                  return (
                    <span
                      key={time}
                      title={slot ? (slot.status === 'reserve' ? 'Réservé' : slot.status === 'libre' ? 'Libre' : 'Fermé') : 'Fermé'}
                      className={cn(
                        'h-7 rounded-6',
                        slot?.status === 'reserve' && 'border border-tint-200 bg-tint-100',
                        slot?.status === 'libre' && 'border border-dashed border-line-field bg-paper',
                        (!slot || slot.status === 'bloque') && 'bg-surface-2',
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <p className="tnum m-0 mt-3 flex flex-wrap items-center gap-4 text-13 text-ink-2">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-3 rounded-3 border border-tint-200 bg-tint-100" />
              {plural(day.booked, 'réservé', 'réservés')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-3 rounded-3 border border-dashed border-line-field" />
              {plural(day.free, 'libre', 'libres')}
            </span>
          </p>
        </>
      )}
      <p className="m-0 mt-3 flex gap-2 text-13 text-ink-3">
        <Icon name="cadenas" size={14} className="mt-0.5 shrink-0" />
        Un rendez-vous ne porte que le nom et l’heure. Rien n’est demandé sur la confession.
      </p>
    </section>
  );
};
