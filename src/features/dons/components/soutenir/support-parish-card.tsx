'use client';

import NextLink from 'next/link';

import { cn } from '@/utils/cn';

import { usePublicParish } from '../../api/get-public-parish';
import { AuthorizationNote } from '../shared/authorization-note';

/**
 * Bloc sobre « Soutenir la paroisse » (WEB-FID-Ma-Paroisse, colonne droite ; WEB-Fiche-Paroisse,
 * après les démarches) : une phrase, la mention d'autorisation, un lien « Faire un don ».
 * Rendu seulement si la collecte de la paroisse est ouverte. Jamais sur les écrans d'actes,
 * de messagerie ou de confession (c. 848).
 */
export const SupportParishCard = ({
  nodeId,
  href,
  variant = 'fidele',
  className,
}: {
  nodeId: string | null | undefined;
  /** `paths.app.dons.root.getHref()` côté fidèle, `paths.dons.paroisse.getHref(code)` côté public. */
  href: string;
  /** `fidele` : padding 20, titre 18/26 ; `public` : padding 24, titre 17/24, lien 15. */
  variant?: 'fidele' | 'public';
  className?: string;
}) => {
  const { data } = usePublicParish(nodeId);
  if (!data?.enabled) return null;
  const isPublic = variant === 'public';
  return (
    <section
      aria-labelledby="soutenir-titre"
      className={cn(
        'rounded-16 border border-line bg-paper text-ink shadow-card',
        isPublic ? 'p-6' : 'p-5',
        className,
      )}
    >
      <h2
        id="soutenir-titre"
        className={cn(
          'm-0 font-semibold',
          isPublic ? 'text-17' : 'text-18 leading-[26px]',
        )}
      >
        Soutenir la paroisse
      </h2>
      <p className={cn('m-0 text-14 text-ink-2', isPublic ? 'mt-2' : 'mt-1')}>
        Quête, campagne ou contribution annuelle&nbsp;: votre don est affecté au
        fonds que vous choisissez.
      </p>
      <AuthorizationNote
        authorization={data.authorization}
        compact
        className="m-0 mt-3"
      />
      <NextLink
        href={href}
        className={cn(
          'mt-3 inline-block font-semibold',
          isPublic ? 'text-15' : 'text-14',
        )}
      >
        Faire un don
      </NextLink>
    </section>
  );
};
