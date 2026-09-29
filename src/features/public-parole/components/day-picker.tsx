'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

import { shiftDay } from '../utils/days';

const SQUARE = cn(buttonVariants({ variant: 'outline' }), 'size-10 px-0');

/**
 * Navigation de la Parole du jour (WEB-Parole-du-jour) : « Choisir une date » (calendrier
 * natif), semaine précédente et suivante, retour à aujourd'hui. La date vit dans l'URL.
 */
export const DayPicker = ({ value, isToday }: { value: string; isToday: boolean }) => {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const open = () => {
    const field = input.current;
    if (!field) return;
    try {
      field.showPicker();
    } catch {
      field.focus();
    }
  };
  return (
    <nav aria-label="Changer de jour" className="flex flex-wrap items-center gap-2">
      {!isToday && (
        <NextLink href={paths.parole.getHref()} className={buttonVariants({ variant: 'outline' })}>
          Aujourd&apos;hui
        </NextLink>
      )}
      <span className="relative inline-flex rounded-12 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary">
        <span aria-hidden="true" className={cn(buttonVariants({ variant: 'outline' }), 'px-3.5')}>
          <Icon name="calendrier" size={18} />
          Choisir une date
        </span>
        <label htmlFor="parole-date" className="sr-only">
          Choisir une date dans le calendrier
        </label>
        {/* Champ natif (clavier, lecteur d'écran) posé sous le bouton dessiné : il reçoit le focus. */}
        <input
          ref={input}
          id="parole-date"
          type="date"
          value={value}
          onChange={(event) => {
            if (event.target.value) router.push(paths.parole.getHref(event.target.value));
          }}
          onClick={open}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </span>
      <NextLink href={paths.parole.getHref(shiftDay(value, -7))} aria-label="Semaine précédente" className={SQUARE}>
        <Icon name="chevron-gauche" size={18} />
      </NextLink>
      <NextLink href={paths.parole.getHref(shiftDay(value, 7))} aria-label="Semaine suivante" className={SQUARE}>
        <Icon name="chevron-droite" size={18} />
      </NextLink>
    </nav>
  );
};
