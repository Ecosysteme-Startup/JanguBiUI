'use client';

import { motion } from 'motion/react';

import { cn } from '@/utils/cn';

import { durations, easings } from './tokens';
import { useMotionOK } from './use-motion-ok';

/**
 * Halo pulsant (grain du chapelet actif) : 1 300 ms aller-retour,
 * opacité 0,2 → 0,55, échelle 1,2 → 1,6. À placer dans un parent `relative`
 * de la couleur voulue (`bg-current`). Reduced motion : halo fixe discret.
 */
export function Pulse({ className }: { className?: string }) {
  const ok = useMotionOK();
  return (
    <motion.span
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 rounded-full bg-current',
        className,
      )}
      initial={{ opacity: 0.2, scale: 1.2 }}
      animate={ok ? { opacity: [0.2, 0.55], scale: [1.2, 1.6] } : undefined}
      transition={{
        duration: durations.pulseHalf,
        ease: easings.inOutSine,
        repeat: Infinity,
        repeatType: 'mirror',
      }}
    />
  );
}
