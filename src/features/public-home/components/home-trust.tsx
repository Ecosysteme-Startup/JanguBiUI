import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';
import { SectionHeading } from '@/components/ui/section-heading';
import { paths } from '@/config/paths';

const PILLARS = [
  {
    title: 'Des messages confidentiels',
    text: 'Les messages échangés avec un prêtre sont chiffrés. Aucun administrateur, ni de la paroisse ni de Numerisen, n’y a accès.',
  },
  {
    title: 'Des données qui appartiennent à la paroisse',
    text: 'Les registres restent au presbytère. Jàngu Bi ne vend rien, n’affiche aucune publicité et restitue les données à la paroisse sur simple demande.',
  },
  {
    title: 'Sous l’autorité de l’Église',
    text: 'Les droits suivent les nominations de l’évêque : un curé, un vicaire ou une secrétaire n’agit que sur sa paroisse, et la chancellerie valide chaque ouverture.',
  },
];

/** « IV — Confiance ». */
export const HomeTrust = () => (
  <section aria-labelledby="confiance-titre" className="flex flex-col">
    <SectionHeading number="IV" title="Confiance" aside="Loi n° 2008-12 sur les données personnelles" />
    <h2 id="confiance-titre" className="m-0 mt-8 max-w-[28ch] font-serif text-h2 font-normal text-ink lg:text-title">
      Ce qui est confié à la paroisse reste à la paroisse.
    </h2>
    <dl className="m-0 mt-10 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
      {PILLARS.map((pillar) => (
        <div key={pillar.title} className="border-t border-ink pt-4">
          <dt className="font-serif text-h3 text-ink">{pillar.title}</dt>
          <dd className="m-0 mt-3 text-base text-ink-2">{pillar.text}</dd>
        </div>
      ))}
    </dl>
    <div role="note" className="mt-10 flex flex-wrap items-center gap-4 rounded border border-ink bg-surface px-5 py-4">
      <Icon name="confession" size={24} className="shrink-0 text-ink" />
      <div className="min-w-[220px] flex-1">
        <p className="m-0 font-serif text-h4 italic leading-tight text-ink">La confession ne se fait qu&apos;en présence d&apos;un prêtre.</p>
        <p className="m-0 mt-1 text-sm text-ink-2">
          Jàngu Bi permet seulement de prendre rendez-vous. Les horaires de confession de chaque paroisse figurent sur sa fiche.
        </p>
      </div>
      <NextLink href={paths.paroisses.list.getHref()} className="hit text-base font-medium text-primary underline decoration-1 underline-offset-[5px]">
        Voir les horaires
      </NextLink>
    </div>
  </section>
);
