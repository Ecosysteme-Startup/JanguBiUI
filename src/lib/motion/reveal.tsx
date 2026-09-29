'use client';

import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { useRef } from 'react';
import type { ReactNode } from 'react';

import { durations, easings, revealOffset, staggerStep } from './tokens';
import { useRevealPhase } from './use-reveal-phase';

/** Variantes d'un élément révélé : masquage instantané, apparition 450 ms. */
function itemVariants(delay = 0): Variants {
  return {
    hidden: { opacity: 0, y: revealOffset, transition: { duration: 0 } },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: durations.reveal, ease: easings.outCubic, delay },
    },
  };
}

const staticItemVariants = itemVariants();

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Délai supplémentaire (s). */
  delay?: number;
  id?: string;
  /** Anime aussi s'il est déjà visible au montage (contenu client uniquement). */
  appear?: boolean;
}

/**
 * Apparition au défilement (fade + montée de 8 px, 450 ms, out-cubic), une
 * seule fois, quand le bloc dépasse de 10 % le bas de l'écran.
 * Jamais masqué au rendu serveur (cf. useRevealPhase).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  id,
  appear = false,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const phase = useRevealPhase(ref, appear);
  return (
    <motion.div
      ref={ref}
      id={id}
      className={className}
      initial={false}
      animate={phase === 'static' ? undefined : phase}
      variants={itemVariants(delay)}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** Délai avant le premier enfant (s). */
  delay?: number;
  /** Écart entre deux enfants (s) — 70 ms par défaut. */
  step?: number;
  /** Anime aussi s'il est déjà visible au montage (contenu client uniquement). */
  appear?: boolean;
}

/**
 * Conteneur qui révèle ses <StaggerItem> l'un après l'autre (écart doux).
 * Le conteneur lui-même ne bouge pas : il ne fait que piloter ses enfants.
 */
export function Stagger({
  children,
  className,
  delay = 0,
  step = staggerStep,
  appear = false,
}: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const phase = useRevealPhase(ref, appear);
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={phase === 'static' ? undefined : phase}
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: step, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Enfant d'un <Stagger>. Hérite de la phase du parent. */
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={staticItemVariants}>
      {children}
    </motion.div>
  );
}
