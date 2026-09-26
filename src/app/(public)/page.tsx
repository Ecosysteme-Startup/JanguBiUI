import { HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';

import { diocesesQueryOptions, directoryExcerptQueries } from '@/features/public-annuaire/api/get-directory';
import { publicAnnouncementsQueryOptions } from '@/features/public-annuaire/api/get-public-announcements';
import { DirectoryExcerpt } from '@/features/public-annuaire/components/directory-excerpt';
import { DirectoryStats } from '@/features/public-annuaire/components/directory-stats';
import { LatestAnnouncement } from '@/features/public-annuaire/components/latest-announcement';
import { LatestAnnouncementCover } from '@/features/public-annuaire/components/latest-announcement-cover';
import { HomeFaq } from '@/features/public-home/components/home-faq';
import { HomeHero } from '@/features/public-home/components/home-hero';
import { HomeOffer } from '@/features/public-home/components/home-offer';
import { HomeTrust } from '@/features/public-home/components/home-trust';
import { HomeParvisSlot, HomeUses } from '@/features/public-home/components/home-uses';
import { liturgyDayQueryOptions } from '@/features/public-parole/api/get-liturgy-day';
import { LiturgyWeek } from '@/features/public-parole/components/liturgy-week';
import { ParoleTeaser } from '@/features/public-parole/components/parole-teaser';
import { prefetchPublic } from '@/lib/server-prefetch';

export const metadata: Metadata = {
  title: { absolute: 'Jàngu Bi · La Parole du jour et votre paroisse' },
  description:
    'Les lectures de la messe, les annonces et les horaires de votre paroisse, vos demandes d’extraits d’actes et un échange avec vos prêtres, pour les catholiques du Sénégal.',
};

// La liturgie « du jour » change chaque jour : rendu à la demande.
export const dynamic = 'force-dynamic';

/** Accueil public (maquette Main). */
const HomePage = async () => {
  const state = await prefetchPublic(
    liturgyDayQueryOptions(),
    diocesesQueryOptions(),
    ...directoryExcerptQueries(),
    publicAnnouncementsQueryOptions({ limit: 1 }),
  );
  return (
    <HydrationBoundary state={state}>
      <div className="flex flex-col gap-24">
        <HomeHero stats={<DirectoryStats />} calendar={<LiturgyWeek />} />
        <ParoleTeaser />
        <HomeUses announcement={<LatestAnnouncement />} photo={<LatestAnnouncementCover fallback={<HomeParvisSlot />} />} />
        <HomeOffer />
        <HomeTrust />
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-6">
            <DirectoryExcerpt />
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <HomeFaq />
          </div>
        </div>
      </div>
    </HydrationBoundary>
  );
};

export default HomePage;
