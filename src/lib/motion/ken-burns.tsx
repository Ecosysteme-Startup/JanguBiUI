'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

import { durations, easings } from './tokens';
import { useMotionOK } from './use-motion-ok';

/**
 * Ken Burns des pochettes : 20 s aller-retour, échelle 1,18 → 1,26
 * (1,18 + 0,08 p), translation 14 / 8 px, inOut sine.
 * Le parent doit avoir des dimensions ; ce composant coupe le débordement.
 * Reduced motion : image figée à l'échelle 1,18.
 */
export function KenBurns({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ok = useMotionOK();
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.18, x: 0, y: 0 }}
        animate={
          ok ? { scale: [1.18, 1.26], x: [0, -14], y: [0, -8] } : undefined
        }
        transition={{
          duration: durations.kenBurnsHalf,
          ease: easings.inOutSine,
          repeat: Infinity,
          repeatType: 'mirror',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
