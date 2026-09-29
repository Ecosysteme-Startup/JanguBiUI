import NextLink from 'next/link';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

/**
 * Bandeau permanent, non masquable (RG « pas de confession par message »). Deux rendus Ciel :
 * - `card` (WEB-FID-Pretres, défaut) : carte b50 rayon 16, filet b200, texte b900 15/22, icône info b600,
 *   lien d'action 15/600 à droite ;
 * - `pinned` (WEB-FID-Conversation, WEB-PAR-Messagerie) : bande pleine largeur sous l'en-tête du fil,
 *   b50 et filet bas b100, icône épingle, texte 14/20 ; action en bouton contour 36 px.
 *   `audience="fidele"` : titre en bloc (600) ; `audience="pretre"` : titre en ligne.
 */
export const ConfessionNotice = ({
  bookingHref,
  className,
  description = 'Prenez rendez-vous pour une confession en présentiel.',
  actionLabel = 'Prendre rendez-vous',
  variant = 'card',
  audience = 'fidele',
}: {
  bookingHref: string;
  className?: string;
  /** Variante prêtre (PAR-Messagerie) : consigne et libellé du lien adaptés. */
  description?: string;
  actionLabel?: string;
  variant?: 'card' | 'pinned';
  audience?: 'fidele' | 'pretre';
}) =>
  variant === 'card' ? (
    <div
      role="note"
      className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 rounded-16 border border-line-active bg-tint-50 px-5 py-4 text-15 text-tint-900', className)}
    >
      <Icon name="info" size={20} className="shrink-0 text-primary" />
      <p className="m-0 min-w-[200px] flex-1">
        <strong className="font-semibold">La confession ne se fait pas par message.</strong> {description}
      </p>
      <NextLink href={bookingHref} className="whitespace-nowrap font-semibold text-primary hover:text-primary-strong">
        {actionLabel}
      </NextLink>
    </div>
  ) : (
    <div
      role="note"
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-tint-100 bg-tint-50 py-3 pr-6 text-14 text-tint-900',
        audience === 'fidele' ? 'pl-8' : 'pl-6',
        className,
      )}
    >
      <Icon name="epingle" size={18} className="shrink-0 text-primary" />
      <p className="m-0 min-w-[200px] flex-1">
        {audience === 'fidele' ? (
          <>
            <strong className="block font-semibold">La confession ne se fait pas par message.</strong>
            {description}
          </>
        ) : (
          <>
            <strong className="font-semibold">La confession ne se fait pas par message.</strong> {description}
          </>
        )}
      </p>
      <NextLink
        href={bookingHref}
        className={cn(
          'hit inline-flex h-9 items-center whitespace-nowrap rounded-10 border border-line-active bg-paper px-3 text-14 font-semibold hover:bg-surface',
          audience === 'fidele' ? 'text-tint-800 hover:text-tint-800' : 'text-ink hover:text-ink',
        )}
      >
        {actionLabel}
      </NextLink>
    </div>
  );
