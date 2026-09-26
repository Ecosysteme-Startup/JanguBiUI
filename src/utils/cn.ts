import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** Échelle typographique de tailwind.config.cjs (tailles « Ciel produit » en px + anciens noms). */
export const FONT_SIZES = [
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '22', '24', '28', '30', '32', '36', '40', '48', '56',
  'meta', 'xs', 'sm', 'base', 'body', 'lead', 'h4', 'h3', 'h2', 'title', 'h1', 'display',
];

/** Rayons numériques de tailwind.config.cjs (3, 6, 8, 9, 10, 12, 14, 16). */
const RADII = ['3', '6', '8', '9', '10', '12', '14', '16'];

/**
 * tailwind-merge doit connaître l'échelle typographique et les rayons de la charte :
 * sinon `text-15` ou `text-meta` passent pour des couleurs et effacent `text-on-primary`
 * (bouton primaire en encre sur bleu), et `rounded-12` ne remplace pas `rounded`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: FONT_SIZES }],
      rounded: [{ rounded: RADII }],
      'rounded-t': [{ 'rounded-t': RADII }],
      'rounded-b': [{ 'rounded-b': RADII }],
      'rounded-l': [{ 'rounded-l': RADII }],
      'rounded-r': [{ 'rounded-r': RADII }],
      shadow: [{ shadow: ['card', 'menu', 'modal'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
