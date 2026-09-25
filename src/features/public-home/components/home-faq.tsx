import { SectionHeading } from '@/components/ui/section-heading';
import { frenchTypo } from '@/utils/french-typo';

const QUESTIONS = [
  {
    q: 'Puis-je me confesser par message ?',
    a: 'Non. Le sacrement de réconciliation se reçoit en présence d’un prêtre. Jàngu Bi permet de réserver un créneau de confession et d’échanger avec un prêtre pour un conseil ou une démarche, jamais de se confesser à distance.',
  },
  {
    q: 'Comment obtenir un extrait de baptême pour mon mariage ?',
    a: 'La demande est adressée à la paroisse où vous avez été baptisé. L’original papier, signé et scellé, est à retirer au secrétariat.',
  },
  {
    q: 'Ma paroisse n’est pas encore sur Jàngu Bi. Que faire ?',
    a: 'Vous pouvez déjà lire la Parole du jour et consulter sa fiche. Parlez-en à votre curé : l’ouverture se fait avec l’accord de la chancellerie.',
  },
  {
    q: 'Qui peut lire mes messages à un prêtre ?',
    a: 'Le prêtre à qui vous écrivez. Les messages sont chiffrés et aucun administrateur, de la paroisse ou de Numerisen, n’y a accès.',
  },
  { q: 'L’application est-elle payante ?', a: 'Non. Elle est gratuite pour les fidèles, et le pilote l’est aussi pour les paroisses.' },
];

/** « VI — Questions fréquentes ». */
export const HomeFaq = () => (
  <section aria-labelledby="faq-titre" className="flex flex-col">
    <SectionHeading number="VI" title="Questions fréquentes" aside={`${QUESTIONS.length} questions`} />
    <h2 id="faq-titre" className="m-0 mt-8 font-serif text-h3 font-normal text-ink md:text-h2">
      Ce qu&apos;on nous demande à la sortie de la messe.
    </h2>
    <div className="mt-8 border-b border-line">
      {QUESTIONS.map(({ q, a }, index) => (
        <details key={q} open={index === 0} className="group border-t border-line">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-serif text-h4 text-ink [&::-webkit-details-marker]:hidden">
            {frenchTypo(q)}
            <span aria-hidden="true" className="text-primary transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="m-0 pb-5 text-base text-ink-2">{frenchTypo(a)}</p>
        </details>
      ))}
    </div>
  </section>
);
