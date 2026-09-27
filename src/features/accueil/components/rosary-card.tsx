'use client';

import NextLink from 'next/link';

import { cardClasses } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { useRosaryToday } from '@/hooks/use-rosary-today';
import { cn } from '@/utils/cn';

/** « Lumineux » (API) ou « Mystères lumineux » : toujours « Mystères lumineux ». */
const groupTitle = (name: string) => (/^myst/i.test(name) ? name : `Mystères ${name.toLowerCase()}`);

/** « Chapelet du jour » : absent de la maquette FID-Accueil, conservé (fonction existante) en carte-lien. */
export const RosaryCard = ({ className }: { className?: string }) => {
  const { data, isError } = useRosaryToday();
  if (isError) return null;
  return (
    <section aria-labelledby="acc-chapelet" className={cn('min-w-0', className)}>
      <NextLink href={paths.app.chapelet.getHref()} className={cn(cardClasses({ interactive: true }), 'flex items-center gap-4')}>
        <span className="min-w-0 flex-1">
          <span className="block text-13 text-ink-3">Chapelet du jour · environ 20 min</span>
          <h2 id="acc-chapelet" className="m-0 mt-1 text-16 font-semibold text-ink">
            {data ? groupTitle(data.day.group.name) : 'Chapelet du jour'}
          </h2>
          <span className="mt-0.5 block text-14 font-semibold text-primary">Commencer la prière</span>
        </span>
        <Icon name="chevron-droite" size={18} className="shrink-0 text-ink-3" />
      </NextLink>
    </section>
  );
};
