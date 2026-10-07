import { StaffHomeRedirect } from '@/components/layouts/staff-home-redirect';
import { ConfessionCard } from '@/features/accueil/components/confession-card';
import { CurrentRequestCard } from '@/features/accueil/components/current-request-card';
import { HomeGreeting } from '@/features/accueil/components/home-greeting';
import { LatestAnnouncements } from '@/features/accueil/components/latest-announcements';
import { MyIntentions } from '@/features/accueil/components/my-intentions';
import { NextEvent } from '@/features/accueil/components/next-event';
import { NextMasses } from '@/features/accueil/components/next-masses';
import { PriestCard } from '@/features/accueil/components/priest-card';
import { RosaryCard } from '@/features/accueil/components/rosary-card';
import { WordOfTheDay } from '@/features/accueil/components/word-of-the-day';

const row = 'mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_336px] xl:items-start';

/** Accueil de l'espace fidèle (FID-Accueil) : Parole, messes, demande, confession, annonces, intentions, prêtre. */
const FideleHomePage = () => (
  <div className="jb-cascade min-w-0 overflow-x-clip [overflow-clip-margin:16px]">
    {/* Un responsable est renvoyé vers son espace (JB-WEB-033/037/043). */}
    <StaffHomeRedirect />
    <HomeGreeting />
    <div className={row}>
      <WordOfTheDay />
      <NextMasses />
    </div>
    <div className={row}>
      <CurrentRequestCard />
      <ConfessionCard />
    </div>
    <div className={row}>
      <div className="flex min-w-0 flex-col gap-8">
        <LatestAnnouncements />
        <NextEvent />
        <MyIntentions />
      </div>
      <div className="flex min-w-0 flex-col gap-8">
        <PriestCard />
        <RosaryCard />
      </div>
    </div>
  </div>
);

export default FideleHomePage;
