'use client';

import { motion } from 'motion/react';
import type {
  HTMLMotionProps,
  TargetAndTransition,
  Transition,
} from 'motion/react';

import { durations, easings } from './tokens';
import { useMotionOK } from './use-motion-ok';

interface PressProps {
  whileTap?: TargetAndTransition;
  whileHover?: TargetAndTransition;
  transition: Transition;
}

/**
 * Props de pression à étaler sur n'importe quel élément `motion.*` :
 * échelle 0,97 en 90 ms à l'appui, retour en 160 ms ; `lift` ajoute une
 * élévation de 2 px au survol (souris uniquement, via `whileHover`).
 */
export function pressProps(ok: boolean, lift = false): PressProps {
  return {
    whileTap: ok
      ? {
          scale: 0.97,
          transition: { duration: durations.pressIn, ease: easings.outCubic },
        }
      : undefined,
    whileHover: ok && lift ? { y: -2 } : undefined,
    transition: { duration: durations.pressOut, ease: easings.outCubic },
  };
}

type PressScaleProps = HTMLMotionProps<'div'> & {
  /** Élévation de 2 px au survol (cartes, boutons de téléchargement). */
  lift?: boolean;
};

/** Enveloppe « pressable » : réaction au toucher identique au mobile. */
export function PressScale({ lift = false, ...props }: PressScaleProps) {
  const ok = useMotionOK();
  return <motion.div {...pressProps(ok, lift)} {...props} />;
}
