import NextLink from 'next/link';

import { SectionHeading } from '@/components/ui/section-heading';
import { paths } from '@/config/paths';

/** « 03 — Nos engagements ». */
export const OfferCommitments = () => (
  <section aria-labelledby="engagements-titre" className="flex flex-col">
    <SectionHeading id="engagements-titre" number="03" title="Nos engagements" aside="Pris avec l’ordinaire du lieu" />
    <dl className="m-0 mt-6 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
      <div className="border-t border-ink pt-4">
        <dt className="font-serif text-h3 text-ink">Gratuité</dt>
        <dd className="m-0 mt-3 text-base text-ink-2">
          Le pilote ne coûte rien à la paroisse ni au diocèse : ni abonnement, ni matériel imposé, ni reconduction tacite. Jàngu Bi reste
          gratuit pour les fidèles, sans publicité.
        </dd>
      </div>
      <div className="border-t border-ink pt-4">
        <dt className="font-serif text-h3 text-ink">Données</dt>
        <dd className="m-0 mt-3 text-base text-ink-2">
          Traitées selon la loi n° 2008-12 sur la protection des données à caractère personnel. Elles appartiennent à la paroisse ; en cas
          d&apos;arrêt, elles lui sont remises puis effacées.{' '}
          <NextLink href={paths.confidentialite.getHref()} className="text-primary underline">
            Politique de confidentialité
          </NextLink>
        </dd>
      </div>
      <div className="border-t border-ink pt-4">
        <dt className="font-serif text-h3 text-ink">Validation</dt>
        <dd className="m-0 mt-3 text-base text-ink-2">
          Aucune paroisse n&apos;est ouverte sans l&apos;accord du curé et de la chancellerie. Les comptes du personnel suivent les
          nominations en vigueur.
        </dd>
      </div>
    </dl>
  </section>
);
