import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';

import type { ParishEvent } from '../api/get-events';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Pavé de date 52 × 56 (« oct. / 4 ») ; `highlight` : le prochain, en teinte. */
export const DateTile = ({ date, highlight = false, className }: { date: string; highlight?: boolean; className?: string }) => {
  const d = dayjs(date);
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-14 w-13 shrink-0 flex-col items-center justify-center rounded-12',
        highlight ? 'bg-tint-50 text-tint-800' : 'border border-line bg-surface text-ink',
        className,
      )}
    >
      <span className={cn('text-12', !highlight && 'text-ink-3')}>{d.format('MMM')}</span>
      <span className="tnum text-20 font-semibold leading-6">{d.format('D')}</span>
    </span>
  );
};

/** Carte d'événement (FID-Ma-Paroisse « Événements à venir ») : date, titre 16/600, jour et lieu. */
export const EventRow = ({ event, highlight = false }: { event: ParishEvent; highlight?: boolean }) => {
  const start = dayjs(event.start_at);
  return (
    <li>
      <NextLink
        href={paths.app.paroisse.evenement.getHref(event.id)}
        className="flex items-center gap-4 rounded-16 border border-line bg-paper px-4 py-3.5 text-ink transition-colors hover:border-line-active hover:text-ink hover:no-underline"
      >
        <DateTile date={event.start_at} highlight={highlight} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-16 font-semibold">
            <span className="sr-only">{start.format('dddd D MMMM')} : </span>
            {frenchTypo(event.title)}
          </span>
          <span className="text-14 text-ink-2">
            {[`${capitalize(start.format('dddd'))}, ${hour(event.start_at)}`, event.location].filter(Boolean).join(' · ')}
            {event.is_cancelled && <span className="font-semibold text-err"> · annulé</span>}
            {event.is_registered && !event.is_cancelled && <span className="font-semibold text-primary"> · vous êtes inscrit(e)</span>}
          </span>
        </span>
        <Icon name="chevron-droite" size={18} className="shrink-0 text-ink-3" />
      </NextLink>
    </li>
  );
};
