'use client';

import NextLink from 'next/link';

import { cardClasses } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { useMe } from '@/hooks/use-me';
import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';
import { frenchTypo } from '@/utils/french-typo';
import { plural } from '@/utils/plural';

import { useEvents } from '../api/get-events';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Prochain événement de la paroisse : absent de la maquette FID-Accueil, conservé (fonction existante). */
export const NextEvent = ({ className }: { className?: string }) => {
  const { data: me } = useMe();
  const { data } = useEvents(me?.paroisse_suivie?.id ?? null);
  const event = data?.results.find((e) => !e.is_cancelled);
  if (!event) return null;
  const meta = [
    `${capitalize(dayjs(event.start_at).format('dddd D MMMM'))} à ${hour(event.start_at)}`,
    event.location,
    event.seats_remaining !== null ? plural(Math.max(0, event.seats_remaining), 'place restante', 'places restantes') : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <section aria-labelledby="acc-evenement" className={cn('min-w-0', className)}>
      <NextLink href={paths.app.paroisse.evenement.getHref(event.id)} className={cn(cardClasses({ interactive: true }), 'flex items-center gap-4')}>
        <span className="min-w-0 flex-1">
          <span className="block text-13 text-ink-3">Prochain événement</span>
          <h2 id="acc-evenement" className="m-0 mt-1 text-16 font-semibold text-ink">
            {frenchTypo(event.title)}
          </h2>
          <span className="mt-0.5 block text-14 text-ink-2">{meta}</span>
        </span>
        <Icon name="chevron-droite" size={18} className="shrink-0 text-ink-3" />
      </NextLink>
    </section>
  );
};
