'use client';

import NextLink from 'next/link';

import { SectionHeading } from '@/components/ui/section-heading';
import { paths } from '@/config/paths';
import { useRosaryToday } from '@/hooks/use-rosary-today';
import { dayjs } from '@/utils/dates';


const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « Chapelet du jour » (FID-Accueil 05, MOB-Accueil 05). */
export const RosaryCard = ({ number, className }: { number: string; className?: string }) => {
  const { data, isError } = useRosaryToday();
  return (
    <section aria-labelledby="acc-chapelet" className={className}>
      <SectionHeading id="acc-chapelet" number={number} title="Chapelet du jour" aside={capitalize(dayjs().format('dddd'))} />
      {isError ? (
        <p className="m-0 text-base text-ink-2">Les mystères du jour n’ont pas pu être chargés.</p>
      ) : (
        <>
          <p className="m-0 mt-4 font-serif text-h4 text-ink">{data?.day.group.name ?? ' '}</p>
          <p className="m-0 mt-1 text-sm text-ink-3">5 dizaines · environ 20 min</p>
        </>
      )}
      <NextLink href={paths.app.chapelet.getHref()} className="mt-3 inline-block font-medium">
        Commencer
      </NextLink>
    </section>
  );
};
