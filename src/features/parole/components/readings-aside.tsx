import { LiturgicalPill } from '@/components/ui/badge';
import type { LiturgyDay } from '@/features/parole/api/get-liturgy-day';
import { OrdinalText } from '@/features/parole/components/ordinal-text';
import { yearLine } from '@/features/parole/utils/liturgy';
import { dayjs } from '@/utils/dates';

/** Colonne d'appui (FID-Parole) : fiche du jour liturgique, écoute des lectures. */
export const ReadingsAside = ({ day, sunday }: { day: LiturgyDay; sunday?: LiturgyDay }) => (
  <aside aria-label="Autour des lectures" className="flex min-w-0 flex-col gap-6">
    <section aria-labelledby="jour-titre" className="rounded-16 border border-line bg-surface p-6">
      <LiturgicalPill color={day.calendar.color} />
      <h2 id="jour-titre" className="m-0 mt-3 text-18 font-semibold text-ink">
        <OrdinalText text={day.calendar.celebration} />
      </h2>
      <dl className="m-0 mt-4 grid grid-cols-[76px_minmax(0,1fr)] gap-x-3 gap-y-2 text-14">
        <dt className="text-ink-3">Année</dt>
        <dd className="m-0 text-ink">{yearLine(day.calendar)}</dd>
        {day.readings.length > 0 && (
          <>
            <dt className="text-ink-3">Lectures</dt>
            <dd className="tnum m-0 text-ink">
              {day.readings.map((r, i) => (
                <span key={`${r.type}-${i}`} className="block">
                  {r.citation}
                </span>
              ))}
            </dd>
          </>
        )}
        {sunday && sunday.date !== day.date && (
          <>
            <dt className="text-ink-3">Dimanche</dt>
            <dd className="m-0 text-ink">
              <OrdinalText text={sunday.calendar.celebration} />, le {dayjs(sunday.date).format('D MMMM')}
            </dd>
          </>
        )}
      </dl>
    </section>

    {day.audio_url && (
      <section aria-labelledby="ecouter-titre" className="rounded-16 border border-line bg-paper p-6 shadow-card">
        <h2 id="ecouter-titre" className="m-0 text-18 font-semibold text-ink">
          Écouter
        </h2>
        <p className="m-0 mt-1 text-14 text-ink-2">Les lectures du jour, à voix haute.</p>
        {/* Pas de sous-titres fournis par l'API : le texte intégral des lectures en tient lieu. */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio controls preload="none" src={day.audio_url} className="mt-4 w-full">
          Votre navigateur ne lit pas l’audio.
        </audio>
      </section>
    )}
  </aside>
);
