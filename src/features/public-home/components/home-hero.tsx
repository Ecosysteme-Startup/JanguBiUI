import NextLink from 'next/link';
import type { ReactNode } from 'react';

import { PhotoSlot } from '@/components/signature/photo-slot';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';

/**
 * Ouverture de l'accueil public (Main) : accroche, deux actions, calendrier liturgique de la
 * semaine et photo. Les chiffres de l'annuaire et le calendrier sont passés en emplacements.
 */
export const HomeHero = ({ stats, calendar }: { stats?: ReactNode; calendar?: ReactNode }) => (
  <section aria-labelledby="hero-titre" className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12 lg:gap-6">
    <div className="flex flex-col lg:col-span-7 lg:pr-6">
      <p className="tnum m-0 flex flex-wrap items-center gap-4 text-meta text-ink-2">
        <span className="text-primary">Pour les catholiques du Sénégal</span>
        <span aria-hidden="true" className="inline-block h-px w-10 bg-ink" />
        {stats}
      </p>
      <h1 id="hero-titre" className="m-0 mt-6 max-w-[16ch] break-words font-serif text-h1 font-normal text-ink lg:text-display">
        Chaque jour la Parole. Chaque semaine, <em className="italic text-primary">votre paroisse.</em>
      </h1>
      <p className="m-0 mt-8 max-w-[56ch] text-lead text-ink-2">
        Les lectures de la messe, les annonces de votre paroisse, le suivi de vos demandes d&apos;extraits d&apos;actes et un échange
        sûr avec vos prêtres. Conçue avec les paroisses de l&apos;Archidiocèse de Dakar.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Button asChild size="lg">
          <NextLink href={paths.auth.inscription.getHref()}>
            S&apos;inscrire <Icon name="fleche-droite" size={16} />
          </NextLink>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <NextLink href={paths.paroisses.list.getHref()}>
            <Icon name="pin" size={16} />
            Trouver ma paroisse
          </NextLink>
        </Button>
        <span className="ml-2 text-sm text-ink-3">
          Gratuit pour les fidèles.
          <br />
          Paroisse pilote : Saint-Dominique, Point E.
        </span>
      </div>
      {calendar}
    </div>
    <PhotoSlot slot="main-nef-lumiere" caption="Lumière de 7 h dans la nef, église Saint-Dominique" ratio="3:4" className="lg:col-span-5" />
  </section>
);
