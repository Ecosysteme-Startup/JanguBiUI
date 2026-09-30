import NextLink from 'next/link';
import type { ReactNode } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { Tilt3D } from '@/lib/motion/tilt-3d';
import { cn } from '@/utils/cn';

/** Carte flottante de l'aperçu (rayon 16, bordure line, ombre de menu). */
export const PREVIEW_CARD = 'rounded-16 border border-line bg-paper shadow-menu';

/** Dessin de la nef de Saint-Dominique, en attendant la photo (`data-photo-slot`). */
const HeroDrawing = ({ className }: { className?: string }) => (
  <div data-photo-slot="accueil-hero-saint-dominique" className={cn('overflow-hidden rounded-16 bg-tint-50', className)}>
    <svg viewBox="0 0 512 580" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="block size-full">
      <path d="M0 580V452h512v128z" className="fill-tint-100" />
      <path d="M166 580V250a90 90 0 0 1 180 0v330" className="fill-tint-100" />
      <path d="M198 580V262a58 58 0 0 1 116 0v318" className="fill-tint-50" />
      <path d="M256 60v74M232 84h48" className="stroke-tint-300" strokeWidth="3" strokeLinecap="round" />
      <path d="M256 160 40 580M256 160 472 580M256 160v420" className="stroke-tint-200" strokeWidth="1" />
      <circle cx="256" cy="330" r="22" fill="none" className="stroke-tint-200" strokeWidth="1.5" />
    </svg>
  </div>
);

type HomeHeroProps = {
  /** Carte « Parole du jour » (rendue avec les classes de positionnement reçues). */
  parole: (className: string) => ReactNode;
  /** Carte « Prochaine messe ». */
  masses: (className: string) => ReactNode;
};

/**
 * Ouverture de l'accueil public (WEB-Accueil) : accroche, deux actions, et un aperçu de
 * l'application (dessin, carte de la Parole du jour, prochaines messes de la paroisse pilote).
 */
export const HomeHero = ({ parole, masses }: HomeHeroProps) => (
  <section
    aria-labelledby="hero-titre"
    className="jb-container grid grid-cols-1 items-center gap-12 pb-16 pt-12 md:pb-[88px] md:pt-18 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] xl:grid-cols-[minmax(0,1fr)_600px] xl:gap-16"
  >
    <div>
      <span className="jb-rise inline-flex min-h-8 items-center gap-2 rounded-full bg-tint-50 [--jb-delay:200ms] px-3.5 py-1 text-14 font-medium text-tint-800">
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary-fill" />
        En service à la paroisse Saint-Dominique, Point E
      </span>
      <h1 id="hero-titre" className="jb-rise m-0 mt-6 text-40 [--jb-delay:270ms] font-semibold text-ink md:text-56">
        La Parole et votre paroisse, au même endroit
      </h1>
      <p className="jb-rise m-0 mt-6 max-w-[520px] text-18 [--jb-delay:340ms] text-ink-2 md:text-20 md:leading-[30px]">
        Les lectures du jour, les horaires et annonces de votre paroisse, vos demandes d&apos;extraits d&apos;actes et l&apos;échange avec
        un prêtre. Pour les catholiques du Sénégal.
      </p>
      <div className="jb-rise mt-10 flex flex-wrap items-center gap-3 [--jb-delay:410ms]">
        <NextLink prefetch={false} href={paths.auth.inscription.getHref()} className={buttonVariants({ size: 'xl' })}>
          Créer un compte gratuit
        </NextLink>
        <NextLink href={paths.parole.getHref()} className={cn(buttonVariants({ variant: 'outline', size: 'xl' }), 'gap-2.5')}>
          <Icon name="parole" size={20} />
          Lire la Parole du jour
        </NextLink>
      </div>
      <p className="jb-rise m-0 mt-6 text-14 text-ink-3 [--jb-delay:480ms]">Sur le web, iPhone et Android. La Parole du jour se lit sans compte.</p>
    </div>

    {/* Aperçu : cartes posées sur le dessin (1440 px) ; empilées sous 1024 px. Mouvement : entrée
        en cascade (CSS, joue sans JS), légère inclinaison 3D qui suit la souris (≤ 4°), et la carte
        des messes qui flotte doucement (6 px, inOut sine), sur un élément distinct de son entrée. */}
    <Tilt3D track="window" max={4} innerClassName="relative flex flex-col gap-4 lg:block lg:h-[600px]">
      <HeroDrawing className="jb-rise [--jb-delay:250ms] hidden lg:absolute lg:left-[88px] lg:top-0 lg:block lg:h-[580px] lg:w-[calc(100%-88px)]" />
      <div className="jb-rise [--jb-delay:420ms] lg:absolute lg:left-0 lg:top-12 lg:w-[384px] lg:[transform:translateZ(24px)]">
        {parole(cn(PREVIEW_CARD, 'p-6'))}
      </div>
      <div className="jb-rise [--jb-delay:560ms] lg:absolute lg:left-[216px] lg:top-[408px] lg:w-[352px] lg:max-w-[calc(100%-216px)] lg:[transform:translateZ(40px)]">
        {masses(cn(PREVIEW_CARD, 'p-5 lg:animate-jb-float'))}
      </div>
    </Tilt3D>
  </section>
);
