import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { dayWindow, shiftDay } from '@/features/parole/utils/liturgy';
import { cn } from '@/utils/cn';
import { longDate } from '@/utils/dates';

const arrowClass =
  'hit inline-flex size-10 shrink-0 items-center justify-center rounded border border-line text-ink transition-colors hover:bg-surface-2';

/** Navigation entre les jours : la date est dans l'URL (`?date=AAAA-MM-JJ`), donc partageable. */
export const DayNav = ({ date }: { date: string }) => (
  <nav aria-label="Changer de jour" className="flex items-center gap-1 md:gap-2">
    <NextLink href={paths.app.parole.getHref(shiftDay(date, -1))} aria-label="Jour précédent" className={arrowClass}>
      <Icon name="chevron-gauche" size={16} />
    </NextLink>
    {dayWindow(date).map((d) => {
      const current = d.offset === 0;
      return (
        <NextLink
          key={d.iso}
          href={paths.app.parole.getHref(d.iso)}
          aria-current={current ? 'date' : undefined}
          aria-label={longDate(d.iso)}
          className={cn(
            'size-14 flex-col items-center justify-center transition-colors hover:text-primary',
            Math.abs(d.offset) > 1 ? 'hidden md:flex' : 'flex',
            current ? 'border-b-2 border-primary text-ink' : 'text-ink-2',
          )}
        >
          <span className={cn('tnum text-meta', current && 'text-primary')}>{d.weekday}</span>
          <span className="font-serif text-h3 leading-none">{d.day}</span>
        </NextLink>
      );
    })}
    <NextLink href={paths.app.parole.getHref(shiftDay(date, 1))} aria-label="Jour suivant" className={arrowClass}>
      <Icon name="chevron-droite" size={16} />
    </NextLink>
  </nav>
);
