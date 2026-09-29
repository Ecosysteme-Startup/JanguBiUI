'use client';

import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

interface Options {
  /** Marge de la racine (ex. '0px 0px -10% 0px'). */
  margin?: string;
  /** Part visible requise, entre 0 et 1. */
  amount?: number;
}

/**
 * Devient `true` la première fois que l'élément entre dans l'écran, puis
 * reste `true`. Contrairement à `useInView` de motion, ne plante pas si
 * `IntersectionObserver` est absent (vieux navigateurs, jsdom) : on considère
 * alors l'élément visible, ce qui affiche l'état final.
 */
export function useInViewOnce(
  ref: RefObject<Element | null>,
  { margin, amount = 0 }: Options = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: margin, threshold: amount },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, amount, inView]);

  return inView;
}
