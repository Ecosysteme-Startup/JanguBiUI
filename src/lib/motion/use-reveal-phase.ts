'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { useInViewOnce } from './use-in-view-once';
import { useMotionOK } from './use-motion-ok';

const useIsoLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Marge d'entrée : l'élément doit dépasser de 10 % le bas de l'écran. */
export const REVEAL_MARGIN = '0px 0px -10% 0px';

/**
 * Phase d'apparition d'un bloc :
 * - `static`  : rendu serveur, reduced motion, élément déjà à l'écran au montage
 *               → aucun style posé, le contenu est visible tel quel ;
 * - `hidden`  : élément SOUS la ligne de flottaison au montage → masqué
 *               instantanément (invisible pour l'utilisateur, donc sans flash) ;
 * - `shown`   : l'élément entre dans l'écran → apparition 450 ms.
 *
 * Le contenu n'est donc JAMAIS masqué dans le HTML serveur : sans JS, ou si
 * l'animation ne démarre pas avant le masquage, tout reste lisible.
 */
export function useRevealPhase(
  ref: RefObject<Element | null>,
  /**
   * `appear` : anime aussi un bloc déjà à l'écran au montage. À réserver au
   * contenu monté côté client (après chargement) : le masquage a lieu dans un
   * layout effect, avant la première peinture, donc sans flash. Ne pas
   * l'utiliser sur du contenu rendu par le serveur.
   */
  appear = false,
): 'static' | 'hidden' | 'shown' {
  const ok = useMotionOK();
  const inView = useInViewOnce(ref, { margin: REVEAL_MARGIN });
  const [phase, setPhase] = useState<'static' | 'hidden' | 'shown'>('static');
  const armed = useRef(false);

  useIsoLayoutEffect(() => {
    if (!ok || armed.current) return;
    armed.current = true;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (appear || el.getBoundingClientRect().top > window.innerHeight) {
      setPhase('hidden');
    }
  }, [ok, ref, appear]);

  useEffect(() => {
    if (phase === 'hidden' && inView) setPhase('shown');
  }, [phase, inView]);

  return ok ? phase : 'static';
}
