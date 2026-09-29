'use client';

import { AnimatePresence, motion } from 'motion/react';

import { easings, playerMotion } from '@/lib/motion/tokens';
import { useMotionOK } from '@/lib/motion/use-motion-ok';
import { coverOf } from '@/lib/player/player-store';
import type { Track } from '@/lib/player/types';
import { cn } from '@/utils/cn';

function monogram(track: Track | null): string {
  const name = track?.source?.name ?? track?.title ?? '';
  const words = name
    .replace(/^(chorale|paroisse)\s+/i, '')
    .split(/[\s-]+/)
    .filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Pochette d'une piste (celle de la piste, sinon celle de l'album), ou
 * monogramme sur aplat quand il n'y en a pas. `crossfade` : fondu enchaîné de
 * 280 ms au changement de piste (pochette.fondu).
 */
export function PlayerCover({
  track,
  className,
  alt = '',
  crossfade = false,
}: {
  track: Track | null;
  className?: string;
  alt?: string;
  crossfade?: boolean;
}) {
  const ok = useMotionOK();
  const url = coverOf(track);
  const content = url ? (
    <img
      src={url}
      alt={alt}
      className="absolute inset-0 size-full object-cover"
      draggable={false}
    />
  ) : (
    <span
      aria-hidden
      className="absolute inset-0 flex items-center justify-center bg-surface-2 font-semibold text-ink-2"
      style={{ fontSize: 'clamp(12px, 30%, 96px)' }}
    >
      {monogram(track)}
    </span>
  );

  return (
    <div className={cn('relative overflow-hidden bg-surface-2', className)}>
      {crossfade ? (
        <AnimatePresence initial={false}>
          <motion.div
            key={track?.id ?? 'vide'}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: ok ? playerMotion.coverCrossfade : playerMotion.reduced,
              ease: easings.inOutSine,
            }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      ) : (
        content
      )}
    </div>
  );
}
