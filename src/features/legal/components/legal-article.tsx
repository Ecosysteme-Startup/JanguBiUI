import type { ReactNode } from 'react';

import { SectionHeading } from '@/components/ui/section-heading';

export type LegalSection = { id: string; title: string; body: ReactNode };

/** Page de texte sobre (confidentialité, conditions) : titre, sommaire, sections numérotées. */
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
  <article className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-6">
    <header className="lg:col-span-8">
      <p className="tnum m-0 flex items-center gap-4 text-meta text-ink-2">
        <span className="text-primary">{kicker}</span>
        <span aria-hidden="true" className="inline-block h-px w-10 bg-ink" />
        <span>Mise à jour : {updated}</span>
      </p>
      <h1 className="m-0 mt-4 font-serif text-title font-normal text-ink md:text-h1">{title}</h1>
      <div className="m-0 mt-6 max-w-reading text-lead text-ink-2">{intro}</div>
    </header>
    <nav aria-label="Sommaire" className="border-t border-ink pt-3 lg:sticky lg:top-6 lg:col-span-3 lg:self-start">
      <p className="tnum m-0 text-meta text-ink-3">Sommaire</p>
      <ol className="m-0 mt-3 list-none p-0">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a href={`#${section.id}`} className="flex gap-3 border-b border-line py-2.5 text-base text-ink-2 hover:text-primary">
              <span className="tnum text-meta text-primary">{String(index + 1).padStart(2, '0')}</span>
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
    <div className="flex max-w-reading flex-col gap-12 lg:col-span-8 lg:col-start-5">
      {sections.map((section, index) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-titre`} className="scroll-mt-6">
          <SectionHeading number={String(index + 1).padStart(2, '0')} title={section.title} as="h2" id={`${section.id}-titre`} />
          <div className="mt-4 flex flex-col gap-4 text-body text-ink [&_li]:mt-1.5 [&_p]:m-0 [&_ul]:m-0 [&_ul]:pl-5">{section.body}</div>
        </section>
      ))}
    </div>
  </article>
);
