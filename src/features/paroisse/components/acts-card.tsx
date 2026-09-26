import NextLink from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

/** Carte « Extrait d'acte » : la demande va à la paroisse du sacrement ; l'original se retire sur place. */
export const ActsCard = () => (
  <Card as="section" tone="surface" aria-labelledby="mp-actes">
    <h2 id="mp-actes" className="m-0 text-18 font-semibold text-ink">
      Extrait d’acte
    </h2>
    <p className="m-0 mt-1 text-14 text-ink-2">
      La demande va à la paroisse où le sacrement a été célébré. L’original papier, signé et scellé, se retire au secrétariat de
      cette paroisse.
    </p>
    <NextLink href={paths.app.demandes.nouvelle.getHref()} className={cn(buttonVariants({ variant: 'outline', block: true }), 'mt-4 h-11 hover:no-underline')}>
      Demander un extrait
    </NextLink>
  </Card>
);
