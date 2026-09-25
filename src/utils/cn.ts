import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge doit connaître l'échelle typographique de la charte (tailwind.config.cjs) :
 * sinon `text-body` ou `text-meta` passent pour des couleurs et effacent `text-on-primary`
 * (bouton primaire en encre sur bleu, contraste 3:1).
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['meta', 'xs', 'sm', 'base', 'body', 'lead', 'h4', 'h3', 'h2', 'title', 'h1', 'display'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
