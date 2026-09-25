import { CurrentRequestCard } from '@/features/accueil/components/current-request-card';
import { HomeGreeting } from '@/features/accueil/components/home-greeting';
import { PriestCard } from '@/features/accueil/components/priest-card';
import { RosaryCard } from '@/features/accueil/components/rosary-card';
import { WordOfTheDay } from '@/features/accueil/components/word-of-the-day';
import { ParishWeekDigest } from '@/features/paroisse/components/parish-week-digest';

/** Accueil de l'espace fidèle (FID-Accueil, MOB-Accueil) : composition de plusieurs features. */
const FideleHomePage = () => (
  <div className="mx-auto max-w-[1180px]">
    <HomeGreeting />
    <div className="mt-8 grid gap-10 lg:mt-10 lg:grid-cols-12 lg:gap-6">
      <WordOfTheDay className="lg:col-span-7" />
      <CurrentRequestCard number="02" className="lg:col-span-5" />
    </div>
    <div className="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-6">
      <ParishWeekDigest number="03" className="lg:col-span-6" />
      <PriestCard number="04" className="lg:col-span-3" />
      <RosaryCard number="05" className="lg:col-span-3" />
    </div>
  </div>
);

export default FideleHomePage;
