import { HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';

import { ACTIVE_COUNT_PARAMS, diocesesQueryOptions, directoryQueryOptions, EXCERPT_PARAMS } from '@/features/public-annuaire/api/get-directory';
import { HomeDirectory } from '@/features/public-annuaire/components/home-directory';
import { NextMassesCard } from '@/features/public-annuaire/components/next-masses-card';
import { ParishWeekPreview } from '@/features/public-annuaire/components/parish-week-preview';
import { HomeApp } from '@/features/public-home/components/home-app';
import { HomeHero } from '@/features/public-home/components/home-hero';
import { HomeOffer } from '@/features/public-home/components/home-offer';
import { HomeServices } from '@/features/public-home/components/home-services';
import { liturgyDayQueryOptions } from '@/features/public-parole/api/get-liturgy-day';
import { ParoleHeroCard } from '@/features/public-parole/components/parole-hero-card';
import { ParoleTodaySection } from '@/features/public-parole/components/parole-today-section';
import { PsalmPreview } from '@/features/public-parole/components/psalm-preview';
import { prefetchPublic } from '@/lib/server-prefetch';

import { FaqSection, type FaqItem } from './_components/faq-section';

export const metadata: Metadata = {
  title: { absolute: 'Jàngu Bi · La Parole du jour et votre paroisse' },
  description:
    'Les lectures de la messe, les annonces et les horaires de votre paroisse, vos demandes d’extraits d’actes et un échange avec vos prêtres, pour les catholiques du Sénégal.',
};

// La liturgie « du jour » change chaque jour : rendu à la demande.
export const dynamic = 'force-dynamic';

const QUESTIONS: FaqItem[] = [
  {
    q: 'L’extrait d’acte peut-il être téléchargé ?',
    a: 'Non. Vous faites la demande en ligne auprès de la paroisse du sacrement et suivez son avancement. L’extrait reste un original papier, signé et scellé par la paroisse. Vous le retirez au secrétariat, ou une personne que vous mandatez, sur présentation d’une pièce d’identité.',
  },
  {
    q: 'Puis-je me confesser par message ?',
    a: 'Non. Le sacrement de réconciliation se reçoit en présence d’un prêtre. Jàngu Bi permet de réserver un créneau de confession, sans rien préciser du contenu, et d’échanger avec un prêtre pour un conseil ou une démarche.',
  },
  {
    q: 'Qui peut lire mes échanges avec un prêtre ?',
    a: 'Le prêtre à qui vous écrivez. Les messages sont chiffrés et aucun administrateur, de la paroisse, du diocèse ou de Numerisen, n’y a accès.',
  },
  {
    q: 'Ma paroisse n’est pas encore sur Jàngu Bi. Que faire ?',
    a: 'Vous pouvez déjà lire la Parole du jour et consulter sa fiche dans l’annuaire. Parlez-en à votre curé : l’ouverture se fait avec son accord et celui de la chancellerie.',
  },
  {
    q: 'Faut-il un compte pour lire la Parole du jour ?',
    a: 'Non. La Parole du jour et l’annuaire des paroisses se consultent sans compte. Le compte gratuit sert à suivre votre paroisse, faire une demande d’acte et écrire à un prêtre.',
  },
];

/** Accueil public (WEB-Accueil). */
const HomePage = async () => {
  const state = await prefetchPublic(
    liturgyDayQueryOptions(),
    diocesesQueryOptions(),
    directoryQueryOptions(EXCERPT_PARAMS),
    directoryQueryOptions(ACTIVE_COUNT_PARAMS),
  );
  return (
    <HydrationBoundary state={state}>
      <HomeHero parole={(className) => <ParoleHeroCard className={className} />} masses={(className) => <NextMassesCard className={className} />} />
      <ParoleTodaySection />
      <HomeDirectory />
      <HomeServices paroleVisual={<PsalmPreview />} parishVisual={<ParishWeekPreview />} />
      <HomeApp />
      <HomeOffer />
      <FaqSection
        id="faq-titre"
        title="Questions fréquentes"
        items={QUESTIONS}
        intro={
          <>
            Une autre question&nbsp;? Écrivez à{' '}
            <a href="mailto:aide@jangubi.sn" className="font-semibold">
              aide@jangubi.sn
            </a>
            .
          </>
        }
      />
    </HydrationBoundary>
  );
};

export default HomePage;
