import NextLink from 'next/link';

import { PhotoSlot } from '@/components/signature/photo-slot';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';

/** En-tête de l'offre aux paroisses (PUB-Pour-les-paroisses). */
export const OfferHero = () => (
  <section aria-labelledby="offre-titre" className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
    <div className="lg:col-span-7 lg:pr-6">
      <p className="tnum m-0 flex items-center gap-4 text-meta text-ink-2">
        <span className="text-primary">Paroisses et diocèses</span>
        <span aria-hidden="true" className="inline-block h-px w-10 bg-ink" />
        <span>Pilote 2026-2027</span>
      </p>
      <h1 id="offre-titre" className="m-0 mt-6 max-w-[16ch] break-words font-serif text-title font-normal text-ink md:text-h1">
        Un outil au service du secrétariat, <em className="italic text-primary">sous l&apos;autorité de l&apos;évêque.</em>
      </h1>
      <p className="m-0 mt-8 max-w-[56ch] text-lead text-ink-2">
        Jàngu Bi aide une paroisse à publier ses annonces et ses horaires, à traiter les demandes d&apos;actes et à rendre ses prêtres
        joignables, sans rien changer à la tenue des registres. Le pilote dure 12 semaines et ne coûte rien.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Button asChild size="lg">
          <a href="#contact">
            Demander une présentation <Icon name="fleche-droite" size={16} />
          </a>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <NextLink href={paths.paroisses.list.getHref()}>Voir les paroisses ouvertes</NextLink>
        </Button>
      </div>
    </div>
    <PhotoSlot slot="offre-secretariat-registres" caption="Secrétariat, registres de baptême ouverts" ratio="4:3" className="lg:col-span-5" />
  </section>
);
