'use client';

import { motion } from 'motion/react';

import { cn } from '@/utils/cn';

import { durations, easings } from './tokens';
import { useMotionOK } from './use-motion-ok';

/** Les 4 barres du mobile : durée d'un aller (s), échelle haute, échelle basse. */
const BARS = [
  { d: 0.46, hi: 0.95, lo: 0.35 },
  { d: 0.62, hi: 0.7, lo: 0.2 },
  { d: 0.52, hi: 1, lo: 0.3 },
  { d: 0.7, hi: 0.8, lo: 0.25 },
] as const;

const PAUSED = 0.2;

interface EqualizerProps {
  playing: boolean;
  className?: string;
}

/**
 * Égaliseur décoratif (4 barres 3 × 16 px, `scaleY` depuis le bas).
 * En pause : retombe à 0,2 en 220 ms. Reduced motion : barres figées.
 */
export function Equalizer({ playing, className }: EqualizerProps) {
  const ok = useMotionOK();
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex h-4 items-end gap-[2px] text-accent',
        className,
      )}
    >
      {BARS.map((bar, i) => {
        const loop = playing && ok;
        return (
          <motion.span
            key={i}
            className="block h-4 w-[3px] origin-bottom rounded-full bg-current"
            initial={{ scaleY: PAUSED }}
            animate={
              loop
                ? { scaleY: [bar.lo, bar.hi] }
                : { scaleY: playing ? (bar.lo + bar.hi) / 2 : PAUSED }
            }
            transition={
              loop
                ? {
                    duration: bar.d,
                    ease: easings.inOutQuad,
                    repeat: Infinity,
                    repeatType: 'mirror',
                  }
                : { duration: ok ? durations.eqPause : 0 }
            }
          />
        );
      })}
    </span>
  );
}
