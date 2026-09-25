'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';

import { paths } from '@/config/paths';

/** Choix d'une date (calendrier natif) et retour à aujourd'hui. */
export const DayPicker = ({ value, isToday }: { value: string; isToday: boolean }) => {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="parole-date" className="sr-only">
        Choisir une date dans le calendrier
      </label>
      <input
        id="parole-date"
        type="date"
        value={value}
        onChange={(event) => {
          if (event.target.value) router.push(paths.parole.getHref(event.target.value));
        }}
        className="tnum h-11 rounded border border-line bg-surface px-3 text-base text-ink"
      />
      {isToday ? (
        <span aria-current="date" className="text-sm text-ink-3">
          Aujourd&apos;hui
        </span>
      ) : (
        <NextLink href={paths.parole.getHref()} className="hit inline-flex h-11 items-center rounded border border-line px-3.5 text-base text-ink hover:border-ink">
          Aujourd&apos;hui
        </NextLink>
      )}
    </div>
  );
};
