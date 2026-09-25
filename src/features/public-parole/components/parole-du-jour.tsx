'use client';

import NextLink from 'next/link';

import { LiturgicalColorPill, Ordinals } from '@/components/signature/liturgical-banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { LoadingBlock } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';
import { dayjs, longDate } from '@/utils/dates';

import { useLiturgyDay } from '../api/get-liturgy-day';
import { calendarMeta } from '../utils/calendar';
import { nextSunday, shiftDay } from '../utils/days';

import { DayPicker } from './day-picker';
import { ReadingsList, ReadingTocItem } from './readings-list';
import { ShareActions } from './share-actions';

const dayLabel = (date: string) => dayjs(date).format('dddd D MMMM').replace(/^./, (c) => c.toUpperCase());

/** Libellé court d'un jour voisin : « Veille · mer. 23.09 » + sa célébration. */
const NeighbourDay = ({ date, kind }: { date: string; kind: 'veille' | 'lendemain' }) => {
  const { data } = useLiturgyDay(date);
  const isNext = kind === 'lendemain';
  return (
    <NextLink
      href={paths.parole.getHref(date)}
      className={`group flex flex-1 flex-col gap-1 border-t border-line pt-3 hover:border-ink ${isNext ? 'items-end text-right' : ''}`}
    >
      <span className="tnum text-meta text-ink-3">
        {isNext ? 'Lendemain' : 'Veille'} · {dayjs(date).format('ddd DD.MM')}
      </span>
      <span className="font-serif text-h4 text-ink group-hover:text-primary">
        {data ? <Ordinals text={data.calendar.celebration} /> : dayLabel(date)}
      </span>
    </NextLink>
  );
};

/** La semaine suivante dans le sommaire : le dimanche à venir. */
const NextSunday = ({ from }: { from: string }) => {
  const sunday = nextSunday(from);
  const { data } = useLiturgyDay(sunday);
  if (!data) return null;
  return (
    <div className="mt-8 border-t border-line pt-4">
      <p className="tnum m-0 text-meta text-ink-3">{dayLabel(sunday)}</p>
      <p className="m-0 mt-1.5 font-serif text-h4">
        <NextLink href={paths.parole.getHref(sunday)} className="text-ink hover:text-primary">
          <Ordinals text={data.calendar.celebration} />
        </NextLink>
      </p>
    </div>
  );
};

/**
 * Parole du jour publique (PUB-Parole-du-jour) : navigation entre les jours (date dans
 * l'URL), titre liturgique, sommaire et lectures. Mention de droits (`notice`) toujours
 * affichée ; `readings_available` à faux : le calendrier reste, les lectures sont annoncées.
 */
export const ParoleDuJour = ({ date }: { date?: string }) => {
  const { data, isPending, isError, error } = useLiturgyDay(date);

  if (isPending) return <LoadingBlock label="Chargement des lectures du jour…" lines={6} />;
  if (isError || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <EmptyState
        tone="err"
        icon="alerte"
        title={notFound ? 'Aucune liturgie pour cette date.' : 'Les lectures n’ont pas pu être chargées.'}
        action={
          <Button asChild variant="secondary">
            <NextLink href={paths.parole.getHref()}>Revenir à aujourd&apos;hui</NextLink>
          </Button>
        }
      >
        {notFound ? 'Vérifiez la date demandée.' : 'Le service ne répond pas. Réessayez dans un instant.'}
      </EmptyState>
    );
  }

  const current = data.date;
  const previous = shiftDay(current, -1);
  const next = shiftDay(current, 1);
  const today = dayjs().format('YYYY-MM-DD');
  const meta = calendarMeta(data.calendar);

  return (
    <div>
      <nav aria-label="Changer de jour" className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <NextLink href={paths.parole.getHref(previous)} className="hit inline-flex items-center gap-2 text-base text-primary hover:text-primary-strong">
          <Icon name="fleche-gauche" size={16} />
          {dayLabel(previous)}
        </NextLink>
        <DayPicker value={current} isToday={current === today} />
        <NextLink href={paths.parole.getHref(next)} className="hit inline-flex items-center gap-2 text-base text-primary hover:text-primary-strong">
          {dayLabel(next)}
          <Icon name="fleche-droite" size={16} />
        </NextLink>
      </nav>

      <header className="mt-12 grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
        <div className="lg:col-span-9">
          <p className="tnum m-0 flex flex-wrap items-center gap-4 text-meta text-ink-2">
            <span className="text-primary">La Parole du jour</span>
            <span aria-hidden="true" className="inline-block h-px w-10 bg-ink" />
            <span>{longDate(current)}</span>
            <LiturgicalColorPill color={data.calendar.color} />
          </p>
          <h1 className="m-0 mt-4 max-w-[22ch] font-serif text-title font-normal text-ink md:text-h1">
            <Ordinals text={data.calendar.celebration} />
          </h1>
          <p className="m-0 mt-4 text-base text-ink-3">
            {data.calendar.season_label}
            {meta && ` · ${meta}`}
          </p>
        </div>
        <div className="flex lg:col-span-3 lg:justify-end">
          <ShareActions title={`La Parole du jour · ${longDate(current)}`} path={paths.parole.getHref(current)} />
        </div>
      </header>

      <div className="mt-16 grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-6">
        <aside aria-label="Sommaire des lectures" className="border-t border-ink pt-3 lg:sticky lg:top-6 lg:col-span-3">
          <p className="tnum m-0 text-meta text-ink-3">Au programme</p>
          {data.readings_available && data.readings.length > 0 ? (
            <ol className="m-0 mt-4 list-none border-t border-line p-0">
              {data.readings.map((reading, index) => (
                <ReadingTocItem key={`${reading.type}-${index}`} reading={reading} index={index} />
              ))}
            </ol>
          ) : (
            <p className="m-0 mt-4 text-sm text-ink-2">Les lectures de ce jour ne sont pas encore publiées.</p>
          )}
          <NextSunday from={current} />
          <div className="mt-8 border-t border-line pt-4">
            {data.notice && <p className="m-0 text-sm leading-normal text-ink-2">{data.notice}</p>}
            <NextLink
              href={paths.auth.inscription.getHref()}
              className="hit mt-2 inline-flex items-center gap-2 text-base font-medium text-primary underline decoration-1 underline-offset-[5px]"
            >
              Recevoir chaque matin
              <Icon name="fleche-droite" size={16} />
            </NextLink>
          </div>
        </aside>

        <article className="flex max-w-reading flex-col gap-18 lg:col-span-8 lg:col-start-5">
          {data.readings_available && data.readings.length > 0 ? (
            <ReadingsList readings={data.readings} />
          ) : (
            <EmptyState icon="calendrier" title="Les lectures de ce jour ne sont pas encore disponibles.">
              Le calendrier liturgique est à jour ; les textes seront publiés dès leur réception. Revenez un peu plus tard.
            </EmptyState>
          )}
          <nav aria-label="Jours voisins" className="flex gap-6">
            <NeighbourDay date={previous} kind="veille" />
            <NeighbourDay date={next} kind="lendemain" />
          </nav>
        </article>
      </div>
    </div>
  );
};
