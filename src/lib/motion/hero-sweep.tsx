'use client';

import { motion } from 'motion/react';

import { cn } from '@/utils/cn';

import { durations, easings } from './tokens';
import { useMotionOK } from './use-motion-ok';

/**
 * Balayage lumineux du hero : bande blanche de 160 px inclinée de 16°,
 * opacité max 0,08, qui traverse le bloc en 14 s (inOut quad), en boucle.
 * Le rail (100 % de large) glisse de −65 % à +65 % : la bande, centrée dans
 * le rail, part hors champ à gauche et sort à droite. Purement décoratif ;
 * absent en reduced motion (CSS + JS).
 */
export function HeroSweep({ className }: { className?: string }) {
  const ok = useMotionOK();
  // Toujours rendu (pas d'écart d'hydratation) ; masqué en CSS si reduced motion.
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden',
        className,
      )}
    >
      <motion.div
        className="absolute inset-y-0 left-0 w-full"
        initial={{ x: '-65%' }}
        animate={ok ? { x: '65%' } : undefined}
        transition={{
          duration: durations.sweep,
          ease: easings.inOutQuad,
          repeat: Infinity,
          repeatType: 'loop',
        }}
      >
        <div className="absolute -inset-y-1/4 left-1/2 w-40 -translate-x-1/2 rotate-[16deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]" />
      </motion.div>
    </div>
  );
}
