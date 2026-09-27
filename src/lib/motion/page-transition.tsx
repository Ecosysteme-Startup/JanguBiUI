'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { durations, easings } from './tokens';
import { useMotionOK } from './use-motion-ok';

/** Devient vrai après la première hydratation côté client. */
let hydrated = false;

/**
 * Fondu d'entrée de page (180 ms, opacité seule — aucun déplacement pour ne
 * pas perturber le défilement ni provoquer de CLS). À monter dans un
 * `template.tsx`, qui est recréé à chaque navigation.
 *
 * La toute première page (rendu serveur + hydratation) n'est pas animée :
 * son contenu reste visible même si le JS tarde.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const ok = useMotionOK();
  const [animateIn] = useState(() => hydrated);

  useEffect(() => {
    hydrated = true;
  }, []);

  return (
    <motion.div
      initial={animateIn && ok ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: durations.page, ease: easings.outCubic }}
    >
      {children}
    </motion.div>
  );
}
