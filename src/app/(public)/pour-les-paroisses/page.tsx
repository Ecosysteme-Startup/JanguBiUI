import type { Metadata } from 'next';

import { OfferBenefits } from '@/features/public-offre/components/offer-benefits';
import { OfferContact } from '@/features/public-offre/components/offer-contact';
import { OfferHero } from '@/features/public-offre/components/offer-hero';
import { OfferRoles } from '@/features/public-offre/components/offer-roles';
import { OfferSteps } from '@/features/public-offre/components/offer-steps';

import { FaqSection, type FaqItem } from '../_components/faq-section';

export const metadata: Metadata = {
  title: 'Pour les paroisses',
  description:
    'Jàngu Bi pour les paroisses et diocèses du Sénégal : annonces, horaires, demandes d’actes, messagerie des prêtres. Pilote avec l’archidiocèse de Dakar.',
};

const QUESTIONS: FaqItem[] = [
  {
    q: 'Qui décide de l’arrivée d’une paroisse sur Jàngu Bi ?',
    a: 'Le curé, avec l’accord de la chancellerie de son diocèse. Une demande peut venir d’un paroissien ou du secrétariat, mais rien n’est ouvert sans l’accord du curé.',
  },
  {
    q: 'Nos registres papier sont-ils numérisés ?',
    a: 'Non. Les registres restent au presbytère. Jàngu Bi transmet les demandes d’actes ; le secrétariat vérifie dans le registre et délivre l’original papier, signé et scellé.',
  },
  {
    q: 'Faut-il un ordinateur au secrétariat ?',
    a: 'Un ordinateur ou une tablette avec une connexion internet suffit pour le secrétariat. Les prêtres peuvent répondre depuis leur téléphone.',
  },
  {
    q: 'Les prêtres doivent-ils répondre à tous les messages ?',
    a: 'Non. Chaque prêtre choisit s’il est joignable et à quels moments, et peut suspendre sa disponibilité. La confession ne se fait jamais par message.',
  },
  {
    q: 'Que se passe-t-il quand le curé est nommé ailleurs ?',
    a: 'Ses accès suivent sa nomination : ils se ferment à la date de fin de l’office, et son successeur les reçoit à sa prise de fonction. Les données restent à la paroisse.',
  },
];

/** Offre aux paroisses et formulaire de contact (WEB-Pour-les-paroisses). */
const PourLesParoissesPage = () => (
  <>
    <OfferHero />
    <OfferBenefits />
    <OfferSteps />
    <OfferRoles />
    <FaqSection
      id="faq-paroisses-titre"
      title="Questions des curés et des secrétariats"
      items={QUESTIONS}
      intro={
        <>
          Une autre question&nbsp;? Écrivez à{' '}
          <a href="mailto:paroisses@jangubi.sn" className="font-semibold">
            paroisses@jangubi.sn
          </a>
          .
        </>
      }
    />
    <OfferContact />
  </>
);

export default PourLesParoissesPage;
