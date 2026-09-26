'use client';

import NextLink from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';

import { useSlots } from '../api/get-slots';
import { nextConfessionDay } from '../utils/next-confession';
import { DAY_FORMAT } from '../utils/week';

import { DateTile } from './date-tile';

/** « Confessions le samedi » (FID-Pretres) : prochain jour de confession de la paroisse suivie. */
export const NextConfessionCard = ({ nodeId }: { nodeId: string | null }) => {
  const slots = useSlots(nodeId, dayjs().format(DAY_FORMAT));
  const next = slots.data ? nextConfessionDay(slots.data) : null;

  return (
    <section
      aria-labelledby="confessions-titre"
      className="flex flex-col gap-4 rounded-16 border border-line bg-surface p-6 sm:flex-row sm:items-center sm:gap-6"
    >
      {next && <DateTile date={next.day} className="hidden sm:flex" />}
      <div className="min-w-0 flex-1">
        <h2 id="confessions-titre" className="m-0 text-18 font-semibold text-ink">
          {next ? `Confessions le ${dayjs(next.day).format('dddd')}` : 'Confessions'}
        </h2>
        <p className="m-0 mt-1 text-15 text-ink-2">
          {next
            ? `De ${hour(next.from)} à ${hour(next.to)}, ${next.place}. Réservez un créneau de ${next.minutes} minutes : aucun motif n’est demandé.`
            : slots.isPending
              ? 'Chargement des prochains créneaux…'
              : 'Aucun créneau libre annoncé pour le moment. Réservez dès qu’un créneau s’ouvre : aucun motif n’est demandé.'}
        </p>
      </div>
      <NextLink href={paths.app.confession.getHref()} className={cn(buttonVariants({ size: 'lg' }), 'self-start sm:self-auto')}>
        <Icon name="calendrier" size={18} />
        Prendre rendez-vous
      </NextLink>
    </section>
  );
};
