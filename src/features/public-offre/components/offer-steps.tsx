import NextLink from 'next/link';

import { paths } from '@/config/paths';

const STEPS = [
  { when: 'Semaine 1', title: 'Rencontre et accord', text: 'Présentation au curé et à son équipe. La chancellerie confirme l’entrée de la paroisse dans le pilote.' },
  { when: 'Semaines 2 et 3', title: 'Paramétrage', text: 'Lieux de culte, horaires, types d’actes délivrés, équipe et offices. Nous le faisons avec le référent de la paroisse.' },
  { when: 'Semaine 4', title: 'Formation de l’équipe', text: 'Deux demi-journées sur place pour le secrétariat et les prêtres. Activation de la double authentification.' },
  { when: 'Semaine 5, puis chaque mois', title: 'Ouverture aux fidèles', text: 'Annonce en fin de messe et affiches à l’entrée. Un point mensuel avec le curé pendant la première année.' },
];

/** « Comment se déroule l'arrivée d'une paroisse » (WEB-Pour-les-paroisses) : quatre étapes. */
export const OfferSteps = () => (
  <section aria-labelledby="etapes-titre" className="jb-container pt-16 md:pt-24">
    <h2 id="etapes-titre" className="m-0 text-28 font-semibold text-ink md:text-32">
      Comment se déroule l&apos;arrivée d&apos;une paroisse
    </h2>
    <p className="m-0 mt-2 text-18 text-ink-2">Environ cinq semaines entre l&apos;accord du curé et l&apos;ouverture aux fidèles.</p>
    <ol className="m-0 mt-12 grid list-none grid-cols-1 gap-8 p-0 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((step, index) => (
        <li key={step.title}>
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-tint-50 text-15 font-semibold text-tint-800 ring-1 ring-inset ring-line-active">
              {index + 1}
            </span>
            {index < STEPS.length - 1 && <span aria-hidden="true" className="hidden h-px flex-1 bg-line lg:block" />}
          </div>
          <div className="mt-5 text-13 text-ink-3">{step.when}</div>
          <h3 className="m-0 mt-1 text-18 font-semibold text-ink">{step.title}</h3>
          <p className="m-0 mt-2 text-15 leading-6 text-ink-2">{step.text}</p>
        </li>
      ))}
    </ol>
    <div className="mt-12 flex flex-wrap items-center gap-4 rounded-16 border border-line bg-surface px-6 py-5">
      <p className="m-0 min-w-[240px] flex-1 text-16 text-ink">
        La paroisse Saint-Dominique, Point E, est la première ouverte : ses horaires et ses annonces sont en ligne.
      </p>
      <NextLink href={paths.paroisses.list.getHref()} className="hit shrink-0 text-15 font-semibold">
        Voir les paroisses en ligne
      </NextLink>
    </div>
  </section>
);
