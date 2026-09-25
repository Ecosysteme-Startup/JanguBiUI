import NextLink from 'next/link';

import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';
import { paths } from '@/config/paths';

const LISTS = [
  {
    title: 'Pour le secrétariat',
    items: [
      'Une file unique des demandes d’actes, avec les délais visibles.',
      'Moins d’appels pour les horaires : ils sont publiés une fois.',
      'Les rendez-vous de confession ordonnés par créneau.',
    ],
  },
  {
    title: 'Pour le curé et les prêtres',
    items: [
      'Les annonces du dimanche lues aussi par ceux qui n’étaient pas à la messe.',
      'Une messagerie confidentielle, aux heures que chacun choisit.',
      'Un tableau de bord simple de la vie de la paroisse.',
    ],
  },
];

/** « III — Pour les paroisses » de l'accueil. */
export const HomeOffer = () => (
  <section aria-labelledby="offre-titre" className="flex flex-col">
    <SectionHeading
      number="III"
      title="Pour les paroisses"
      aside={
        <NextLink href={paths.pourLesParoisses.getHref()} className="text-primary">
          L&apos;offre aux paroisses et diocèses
        </NextLink>
      }
    />
    <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-6">
      <div className="flex flex-col lg:col-span-5">
        <h2 id="offre-titre" className="m-0 font-serif text-h2 font-normal text-ink lg:text-title">
          Le secrétariat garde la main. Le curé garde la parole.
        </h2>
        <p className="m-0 mt-6 max-w-[46ch] text-body text-ink-2">
          Chaque paroisse publie elle-même ses annonces et ses horaires, traite ses demandes d&apos;actes et décide quels prêtres sont
          joignables. Le pilote est gratuit pendant 12 semaines, sans engagement de poursuivre.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <Button asChild variant="secondary">
            <NextLink href={paths.contact.getHref()}>Demander une présentation</NextLink>
          </Button>
          <span className="tnum text-meta text-ink-3">Pilote gratuit · 12 semaines</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:col-span-6 lg:col-start-7">
        {LISTS.map((list) => (
          <div key={list.title}>
            <p className="tnum m-0 text-meta text-ink-3">{list.title}</p>
            <ul className="m-0 mt-3 list-none border-b border-line p-0">
              {list.items.map((item) => (
                <li key={item} className="border-t border-line py-3 text-base text-ink">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);
