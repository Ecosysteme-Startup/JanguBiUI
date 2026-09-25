import { SectionHeading } from '@/components/ui/section-heading';
import { frenchTypo } from '@/utils/french-typo';

const QUESTIONS = [
  { q: 'Faut-il un ordinateur au secrétariat ?', a: 'Un ordinateur ou une tablette avec une connexion suffit. Les prêtres utilisent leur téléphone.' },
  { q: 'Qui voit les demandes d’actes ?', a: 'Le secrétariat et le curé de la paroisse du sacrement, et personne d’autre.' },
  { q: 'Les fidèles vont-ils se confesser par écrit ?', a: 'Non. Un bandeau le rappelle dans chaque conversation ; seul le rendez-vous se prend en ligne.' },
  { q: 'Dois-je tout valider moi-même ?', a: 'Non. Vous déléguez au secrétariat selon les offices, et gardez la main sur les annonces.' },
  { q: 'Et si nous arrêtons après le pilote ?', a: 'Vos données vous sont remises, puis effacées. Les fidèles sont prévenus par une annonce.' },
];

/** « 04 — Questions de curés ». */
export const OfferQuestions = () => (
  <section aria-labelledby="questions-titre" className="flex flex-col">
    <SectionHeading number="04" title="Questions de curés" />
    <h2 id="questions-titre" className="m-0 mt-6 font-serif text-h2 font-normal text-ink">
      Ce que les curés nous ont demandé.
    </h2>
    <dl className="m-0 mt-8">
      {QUESTIONS.map(({ q, a }) => (
        <div key={q} className="border-t border-line py-5">
          <dt className="font-serif text-h4 text-ink">{frenchTypo(`« ${q} »`)}</dt>
          <dd className="m-0 mt-2 text-base text-ink-2">{frenchTypo(a)}</dd>
        </div>
      ))}
    </dl>
  </section>
);
