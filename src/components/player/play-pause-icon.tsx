'use client';

import { AnimatePresence, motion } from 'motion/react';

import { easings, playerMotion } from '@/lib/motion/tokens';
import { useMotionOK } from '@/lib/motion/use-motion-ok';

/**
 * Icône lecture ⇄ pause (icone.morph, 160 ms, in-out-sine). Sur le web on
 * fait un fondu + échelle entre le triangle et les deux barres (transform et
 * opacité seulement) ; en mouvement réduit, l'icône est remplacée.
 */
export function PlayPauseIcon({
  playing,
  size = 24,
}: {
  playing: boolean;
  size?: number;
}) {
  const ok = useMotionOK();
  const transition = {
    duration: ok ? playerMotion.iconMorph : 0,
    ease: easings.inOutSine,
  };
  return (
    <span
      aria-hidden
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      <AnimatePresence initial={false}>
        <motion.svg
          key={playing ? 'pause' : 'play'}
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={transition}
        >
          {playing ? (
            <>
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </>
          ) : (
            <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.6-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
          )}
        </motion.svg>
      </AnimatePresence>
    </span>
  );
}
