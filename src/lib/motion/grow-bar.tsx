'use client';

import { motion } from 'motion/react';

import { cn } from '@/utils/cn';

import { durations, easings } from './tokens';
import { useMotionOK } from './use-motion-ok';

interface GrowBarProps {
  /** Part remplie, entre 0 et 1. */
  value: number;
  /** Rang de la barre : délai 600 + i × 220 ms, comme le mobile. */
  index?: number;
  className?: string;
  /** Classe de la partie remplie (couleur). */
  barClassName?: string;
  label?: string;
}

/**
 * Barre de segment qui se remplit de 0 à `value` en 420 ms (out-cubic).
 * Le mobile anime la largeur ; ici on anime `scaleX` depuis la gauche
 * (transform seul, sans relayout). Reduced motion : valeur finale directe.
 */
export function GrowBar({
  value,
  index = 0,
  className,
  barClassName,
  label,
}: GrowBarProps) {
  const ok = useMotionOK();
  const v = Math.max(0, Math.min(1, value));
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-surface-2',
        className,
      )}
    >
      <motion.div
        className={cn(
          'h-full w-full origin-left rounded-full bg-primary-fill',
          barClassName,
        )}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: v }}
        viewport={{ once: true }}
        transition={
          ok
            ? {
                duration: durations.bar,
                ease: easings.outCubic,
                delay: durations.barDelay + index * durations.barStep,
              }
            : { duration: 0 }
        }
      />
    </div>
  );
}
