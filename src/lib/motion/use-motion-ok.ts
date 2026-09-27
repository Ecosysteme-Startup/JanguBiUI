'use client';

import { useReducedMotion } from 'motion/react';

/**
 * `true` quand on peut animer. `false` si l'utilisateur a demandé
 * `prefers-reduced-motion: reduce` : on affiche alors l'état final immédiat.
 *
 * Côté serveur et au premier rendu, `useReducedMotion` renvoie `null` : on le
 * traite comme « OK », mais les composants de ce dossier ne masquent JAMAIS le
 * contenu au rendu serveur (voir <Reveal>), donc aucun contenu n'est caché si
 * le JS ne démarre pas.
 */
export function useMotionOK(): boolean {
  return useReducedMotion() !== true;
}
