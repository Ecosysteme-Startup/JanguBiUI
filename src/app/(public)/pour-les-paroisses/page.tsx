import type { Metadata } from 'next';

import { ContactForm } from '@/features/public-offre/components/contact-form';
import { OfferCommitments } from '@/features/public-offre/components/offer-commitments';
import { OfferHero } from '@/features/public-offre/components/offer-hero';
import { OfferPilot } from '@/features/public-offre/components/offer-pilot';
import { OfferQuestions } from '@/features/public-offre/components/offer-questions';
import { OfferTools } from '@/features/public-offre/components/offer-tools';

export const metadata: Metadata = {
  title: 'Pour les paroisses',
  description:
    'Jàngu Bi pour les paroisses et diocèses du Sénégal : annonces, horaires, demandes d’actes, messagerie des prêtres. Pilote gratuit de 12 semaines.',
};

/** Offre aux paroisses et formulaire de contact (PUB-Pour-les-paroisses). */
const PourLesParoissesPage = () => (
  <div className="flex flex-col gap-24">
    <OfferHero />
    <OfferTools />
    <OfferPilot />
    <OfferCommitments />
    <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-6">
      <div className="lg:col-span-5">
        <OfferQuestions />
      </div>
      <section id="contact" aria-labelledby="contact-titre" className="scroll-mt-6 border border-line bg-surface p-6 md:p-10 lg:col-span-6 lg:col-start-7">
        <p className="tnum m-0 text-meta text-primary">Contact</p>
        <h2 id="contact-titre" className="m-0 mt-2 font-serif text-h2 font-normal text-ink">
          Demander une présentation
        </h2>
        <p className="m-0 mt-3 text-base text-ink-2">
          Nous vous rappelons sous 5 jours ouvrés pour fixer une présentation au presbytère ou à la chancellerie.
        </p>
        <div className="mt-8">
          <ContactForm />
        </div>
      </section>
    </div>
  </div>
);

export default PourLesParoissesPage;
