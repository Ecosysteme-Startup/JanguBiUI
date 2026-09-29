import NextLink from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { paths } from '@/config/paths';

/** Dessin du secrétariat (fenêtre, bureau) en attendant la photo (`data-photo-slot`). */
const SecretariatDrawing = () => (
  <div data-photo-slot="offre-secretariat-saint-dominique" className="h-72 overflow-hidden rounded-16 bg-tint-50 md:h-[440px]">
    <svg viewBox="0 0 520 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="block size-full">
      <path d="M0 440v-96h520v96z" className="fill-tint-100" />
      <path d="M300 344V120a80 80 0 0 1 160 0v224" className="fill-paper" />
      <path d="M300 344V120a80 80 0 0 1 160 0v224" fill="none" className="stroke-tint-200" strokeWidth="2" />
      <path d="M380 40v304M300 200h160" className="stroke-tint-200" strokeWidth="2" />
      <path d="M380 120 140 440M380 120 60 440" className="stroke-tint-200" strokeWidth="1" />
      <path d="M56 344h200v-12H56z" className="fill-tint-200" />
      <path d="M84 332v-56h72v56z" className="fill-paper stroke-tint-200" strokeWidth="1.5" />
      <path d="M176 332v-28h56v28z" className="fill-tint-100" />
    </svg>
  </div>
);

/** Ouverture de « Pour les paroisses » (WEB-Pour-les-paroisses). */
export const OfferHero = () => (
  <section
    aria-labelledby="offre-titre"
    className="jb-container grid grid-cols-1 items-center gap-12 pb-16 pt-12 md:pb-24 md:pt-18 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] xl:grid-cols-[minmax(0,1fr)_520px] xl:gap-20"
  >
    <div>
      <span className="inline-flex min-h-8 items-center gap-2 rounded-full bg-tint-50 px-3.5 py-1 text-14 font-medium text-tint-800">
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary-fill" />
        Pilote en cours avec l&apos;archidiocèse de Dakar
      </span>
      <h1 id="offre-titre" className="m-0 mt-6 text-40 font-semibold text-ink md:text-48">
        Un outil simple pour le secrétariat, le clergé et les fidèles de votre paroisse
      </h1>
      <p className="m-0 mt-6 max-w-[560px] text-18 text-ink-2 md:text-20 md:leading-[30px]">
        Horaires, annonces, demandes d&apos;extraits d&apos;actes et échanges avec les prêtres, dans un seul espace. Conçu avec la paroisse
        Saint-Dominique et la chancellerie de l&apos;archidiocèse.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <NextLink href={paths.contact.getHref()} className={buttonVariants({ size: 'xl' })}>
          Demander une présentation
        </NextLink>
        <NextLink href={paths.paroisses.list.getHref()} className={buttonVariants({ variant: 'outline', size: 'xl' })}>
          Voir les paroisses en ligne
        </NextLink>
      </div>
      <p className="m-0 mt-6 text-14 text-ink-3">Pour les curés, les secrétariats et les chancelleries diocésaines du Sénégal.</p>
    </div>
    <figure className="m-0">
      <SecretariatDrawing />
      <figcaption className="mt-2 text-13 text-ink-3">Le secrétariat de la paroisse Saint-Dominique, Point E.</figcaption>
    </figure>
  </section>
);
