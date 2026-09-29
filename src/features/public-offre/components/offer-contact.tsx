import { Icon } from '@/components/ui/icon';

import { ContactForm } from './contact-form';

const PROMISES = ['Réponse sous 5 jours ouvrés', 'Présentation d’une heure, sur place', 'Aucun engagement avant l’accord du curé'];

/** « Demander une présentation » (WEB-Pour-les-paroisses, ancre #contact) : promesses, contact, formulaire. */
export const OfferContact = () => (
  <section id="contact" aria-labelledby="contact-titre" className="scroll-mt-6 border-t border-line bg-surface">
    <div className="jb-container grid grid-cols-1 items-start gap-12 py-16 md:py-24 lg:grid-cols-[minmax(0,1fr)_560px] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_640px] xl:gap-24">
      <div>
        <h2 id="contact-titre" className="m-0 text-28 font-semibold text-ink md:text-32">
          Demander une présentation
        </h2>
        <p className="m-0 mt-3 text-17 leading-7 text-ink-2">
          Laissez vos coordonnées. L&apos;équipe Numerisen vous rappelle pour convenir d&apos;une rencontre à la paroisse ou à la chancellerie.
        </p>
        <ul className="m-0 mt-8 flex list-none flex-col gap-4 p-0 text-16 text-ink">
          {PROMISES.map((item) => (
            <li key={item} className="flex gap-3">
              <Icon name="check" size={20} className="mt-0.5 shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-8 text-15">
          <div className="flex gap-3">
            <Icon name="mail" size={18} className="mt-0.5 shrink-0 text-ink-3" />
            <a href="mailto:paroisses@jangubi.sn" className="font-semibold">
              paroisses@jangubi.sn
            </a>
          </div>
        </div>
      </div>
      <div className="rounded-16 border border-line bg-paper p-6 shadow-card md:p-10">
        <ContactForm />
      </div>
    </div>
  </section>
);
