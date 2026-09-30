import type { SVGProps } from 'react';

import { cn } from '@/utils/cn';

/**
 * Logo officiel de Jàngu Bi : deux blocs imbriqués formant une croix (même tracé que le mobile,
 * JanguBIMobileApp/template/src/assets/images/logo.svg). Bleu de marque #70CBFF, exposé par le
 * jeton `--jb-brand` (classe `fill-brand`) ; les constantes ci-dessous servent aux fichiers
 * générés hors du DOM (icônes, image Open Graph), où les jetons CSS ne s'appliquent pas.
 */
export const BRAND_BLUE = '#70CBFF';

/** Encre de la charte (`--jb-ink` clair) : fond des icônes d'application et de l'image Open Graph. */
export const BRAND_INK = '#0E1A2B';

/** Cadrage des deux formes dans le plan de travail d'origine (375 × 375). */
export const LOGO_VIEWBOX = '86 71 203 233';
export const LOGO_RATIO = 203 / 233;
export const LOGO_PATHS = [
  'M202.34 101.13h86.37v202.43h-86.37V150.15h52.03v-29.68h-52.03Z',
  'M86.29 71.43h86.37v49.05h-52.04v29.67h52.04v123.72H86.29Z',
] as const;

type LogoProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'width' | 'height' | 'viewBox' | 'color'> & {
  /** Hauteur en px ; la largeur suit le ratio du logo. */
  size?: number;
  /**
   * `brand` : bleu de marque (`--jb-brand`, lisible sur le fond sombre).
   * `mono` : couleur du texte courant (`currentColor`), pour un aplat sombre ou coloré.
   */
  tone?: 'brand' | 'mono';
  /** Couleur explicite (valeur CSS) ; prime sur `tone`. */
  color?: string;
  /** Nom annoncé par les lecteurs d'écran. */
  label?: string;
  /** Logo accompagné du nom écrit : masqué aux lecteurs d'écran pour ne pas l'annoncer deux fois. */
  decorative?: boolean;
};

export const Logo = ({ size = 32, tone = 'brand', color, label = 'Jàngu Bi', decorative = false, className, ...props }: LogoProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox={LOGO_VIEWBOX}
    width={Math.round(size * LOGO_RATIO * 100) / 100}
    height={size}
    focusable="false"
    data-tone={tone}
    {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
    className={cn('shrink-0', !color && (tone === 'brand' ? 'fill-brand' : 'fill-current'), className)}
    style={color ? { fill: color } : undefined}
    {...props}
  >
    {LOGO_PATHS.map((d) => (
      <path key={d} d={d} fillRule="evenodd" />
    ))}
  </svg>
);
