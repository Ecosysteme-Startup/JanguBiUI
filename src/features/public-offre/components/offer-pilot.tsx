import { SectionHeading } from '@/components/ui/section-heading';
import { cn } from '@/utils/cn';

const STEPS = [
  {
    title: 'Paramétrage',
    weeks: 'Semaines 1 et 2',
    span: [1, 2],
    text: 'Lieux de culte, horaires, équipe et offices saisis avec le secrétariat. Comptes du personnel créés, double authentification activée.',
  },
  {
    title: 'Formation',
    weeks: 'Semaines 3 et 4',
    span: [3, 4],
    text: 'Deux demi-journées au presbytère avec la secrétaire, le référent numérique et les prêtres. Premières annonces publiées en interne.',
  },
  {
    title: 'Ouverture aux fidèles',
    weeks: 'Semaines 5 à 10',
    span: [5, 10],
    text: 'Annonce en chaire aux messes du dimanche. Les fidèles s’inscrivent, suivent la paroisse, envoient leurs demandes d’actes et prennent rendez-vous. Point hebdomadaire avec Numerisen.',
  },
  { title: 'Bilan', weeks: 'Semaines 11 et 12', span: [11, 12], text: 'Bilan avec le curé et la chancellerie. La paroisse décide de poursuivre ou non.' },
];

const stepOf = (week: number) => STEPS.findIndex((s) => week >= s.span[0] && week <= s.span[1]);

/** « 02 — Le déroulé du pilote » : 12 semaines, 4 étapes. */
export const OfferPilot = () => (
  <section aria-labelledby="pilote-titre" className="flex flex-col">
    <SectionHeading number="02" title="Le déroulé du pilote" aside="12 semaines · 4 étapes" />
    <div className="mt-8 grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
      <h2 id="pilote-titre" className="m-0 font-serif text-h2 font-normal text-ink lg:col-span-7">
        Trois mois pour juger sur pièces.
      </h2>
      <p className="m-0 text-body text-ink-2 lg:col-span-4 lg:col-start-9">
        Un référent numérique de la paroisse est formé dès le début. Numerisen reste joignable chaque jour ouvré.
      </p>
    </div>
    <ol aria-label="Semaines du pilote" className="m-0 mt-10 hidden list-none grid-cols-12 gap-1 p-0 md:grid">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => (
        <li
          key={week}
          className={cn('tnum border-t-2 pt-2 text-meta', stepOf(week) % 2 === 0 ? 'border-primary text-primary' : 'border-ink text-ink-2')}
        >
          S{week}
        </li>
      ))}
    </ol>
    <ol className="m-0 mt-6 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((step, index) => (
        <li key={step.title} className="border-t border-line pt-4">
          <p className="m-0 font-serif text-h2 leading-none text-primary">{index + 1}</p>
          <h3 className="m-0 mt-4 font-serif text-h3 font-normal text-ink">{step.title}</h3>
          <p className="tnum m-0 mt-1 text-meta text-ink-3">{step.weeks}</p>
          <p className="m-0 mt-3 text-base text-ink-2">{step.text}</p>
        </li>
      ))}
    </ol>
  </section>
);
