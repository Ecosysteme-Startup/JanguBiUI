import type { ReactNode } from 'react';

import { Icon } from '@/components/ui/icon';
import { Reveal, Stagger, StaggerItem } from '@/lib/motion/reveal';
import { frenchTypo } from '@/utils/french-typo';

export type FaqItem = { q: string; a: ReactNode };

/**
 * Questions fréquentes des pages publiques (WEB-Accueil, WEB-Pour-les-paroisses) : titre et
 * contact à gauche, questions dépliables à droite (la première ouverte). `<details>` natif :
 * clavier et lecteur d'écran sans script.
 */
export const FaqSection = ({ id, title, intro, items }: { id: string; title: string; intro: ReactNode; items: FaqItem[] }) => (
  <section
    aria-labelledby={id}
    className="jb-container grid grid-cols-1 gap-8 py-16 md:py-24 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-24"
  >
    <Reveal>
      <h2 id={id} className="m-0 text-28 font-semibold text-ink md:text-32">
        {title}
      </h2>
      <p className="m-0 mt-3 text-17 leading-7 text-ink-2">{intro}</p>
    </Reveal>
    <Stagger className="border-t border-line" delay={0.07}>
      {items.map(({ q, a }, index) => (
        <StaggerItem key={q}>
        <details open={index === 0} className="group border-b border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-18 font-semibold text-ink group-open:pb-3 [&::-webkit-details-marker]:hidden">
            {frenchTypo(q)}
            <Icon name="chevron-bas" size={20} className="shrink-0 text-ink-2 transition-transform duration-200 ease-[cubic-bezier(0.33,1,0.68,1)] group-open:rotate-180" />
          </summary>
          <div className="m-0 pb-6 pr-0 text-16 leading-[26px] text-ink-2 group-open:animate-jb-rise md:pr-14">{a}</div>
        </details>
        </StaggerItem>
      ))}
    </Stagger>
  </section>
);
