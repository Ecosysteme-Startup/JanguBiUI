import type { ReactNode } from 'react';

export type LegalSection = { id: string; title: string; body: ReactNode };

/**
 * Page de texte (confidentialité, conditions), langage des pages publiques « Ciel produit » :
 * titre 40, chapô 18, sommaire collant à gauche (carte surface), sections titrées 24.
 */
export const LegalArticle = ({
  kicker,
  title,
  intro,
  updated,
  sections,
}: {
  kicker: string;
  title: string;
  intro: ReactNode;
  updated: string;
  sections: LegalSection[];
}) => (
  <article className="jb-container pb-24 pt-10">
    <header className="max-w-[760px]">
      <p className="m-0 text-15 font-semibold text-primary">{kicker}</p>
      <h1 className="m-0 mt-2 text-32 font-semibold text-ink md:text-40">{title}</h1>
      <div className="m-0 mt-4 text-18 text-ink-2">{intro}</div>
      <p className="m-0 mt-3 text-14 text-ink-3">Mise à jour : {updated}</p>
    </header>
    <div className="mt-12 grid grid-cols-1 items-start gap-10 lg:grid-cols-[280px_minmax(0,680px)] lg:gap-16 xl:gap-24">
      {/* Sommaire dans sa propre colonne : collant, il ne passe jamais sur le texte (A11Y-09). */}
      <nav aria-label="Sommaire" className="rounded-16 border border-line bg-surface p-5 lg:sticky lg:top-6">
        <p className="m-0 text-13 font-medium text-ink-3">Sommaire</p>
        <ol className="m-0 mt-2 list-none p-0">
          {sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="hit block rounded-8 px-2 py-1.5 text-15 text-ink-2 hover:bg-paper hover:text-ink">
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex min-w-0 flex-col gap-12">
        {sections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-titre`} className="scroll-mt-6">
            <h2 id={`${section.id}-titre`} className="m-0 text-24 font-semibold text-ink">
              {section.title}
            </h2>
            <div className="mt-4 flex flex-col gap-4 text-16 leading-[26px] text-ink-2 [&_a]:font-semibold [&_li]:mt-1.5 [&_p]:m-0 [&_strong]:text-ink [&_ul]:m-0 [&_ul]:pl-5">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </div>
  </article>
);
