'use client';

import { SkipBack, SkipForward } from 'lucide-react';
import { motion } from 'motion/react';
import { forwardRef } from 'react';

import { pressProps } from '@/lib/motion/press-scale';
import { useMotionOK } from '@/lib/motion/use-motion-ok';
import { usePlayerStore } from '@/lib/player/player-store';
import { SKIP_SECONDS } from '@/lib/player/use-player-shortcuts';
import { cn } from '@/utils/cn';

import { PlayPauseIcon } from './play-pause-icon';

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

/** Bouton icône du lecteur (40 × 40, rayon 10, fond au survol). */
export const PlayerIconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function PlayerIconButton({ className, active, type, ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        className={cn(
          'inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-40',
          active && 'bg-surface-2 text-ink-2',
          className,
        )}
        {...props}
      />
    );
  },
);

/** Flèche circulaire avec « 15 » (−15 s / +15 s), comme la maquette. */
export function SkipIcon({
  direction,
  size = 24,
}: {
  direction: 'back' | 'forward';
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {direction === 'back' ? (
        <>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </>
      ) : (
        <>
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </>
      )}
      <text
        x="12"
        y="15.2"
        textAnchor="middle"
        fontSize="7.4"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        15
      </text>
    </svg>
  );
}

/**
 * Commandes de transport : −15 s, précédent, lecture/pause, suivant, +15 s.
 * `size="lg"` : lecteur déployé (bouton rond de 68) ; `sm` : barre (40).
 */
export function TransportControls({
  size = 'sm',
  className,
}: {
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const ok = useMotionOK();
  const status = usePlayerStore((s) => s.status);
  const toggle = usePlayerStore((s) => s.toggle);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const skipBy = usePlayerStore((s) => s.skipBy);
  const nextTitle = usePlayerStore((s) => {
    const n = s.upNext[0] ?? s.tracks[s.order[s.cursor + 1]];
    return n?.title ?? null;
  });
  const prevTitle = usePlayerStore((s) =>
    s.cursor > 0 ? (s.tracks[s.order[s.cursor - 1]]?.title ?? null) : null,
  );
  const playing = status === 'playing' || status === 'loading';
  const lg = size === 'lg';
  const shortcut = lg ? ' (Espace)' : '';

  return (
    <div
      className={cn(
        'flex items-center',
        lg ? 'justify-between px-5' : 'gap-3',
        className,
      )}
    >
      <PlayerIconButton
        aria-label={`Reculer de ${SKIP_SECONDS} secondes`}
        className={cn(lg && 'size-12 text-ink')}
        onClick={() => skipBy(-SKIP_SECONDS)}
      >
        <SkipIcon direction="back" size={lg ? 28 : 22} />
      </PlayerIconButton>
      <PlayerIconButton
        aria-label={
          prevTitle ? `Piste précédente : ${prevTitle}` : 'Piste précédente'
        }
        className={cn('text-ink', lg && 'size-[52px]')}
        onClick={previous}
      >
        <SkipBack
          className={lg ? 'size-[26px]' : 'size-5'}
          fill="currentColor"
          aria-hidden
        />
      </PlayerIconButton>
      <motion.button
        type="button"
        aria-label={`${playing ? 'Mettre en pause' : 'Reprendre la lecture'}${shortcut}`}
        onClick={toggle}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full bg-primary-fill text-on-primary shadow-card transition-colors hover:bg-primary-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
          lg ? 'size-[68px]' : 'size-10',
        )}
        {...pressProps(ok)}
      >
        <PlayPauseIcon playing={playing} size={lg ? 28 : 20} />
      </motion.button>
      <PlayerIconButton
        aria-label={
          nextTitle ? `Piste suivante : ${nextTitle}` : 'Piste suivante'
        }
        className={cn('text-ink', lg && 'size-[52px]')}
        onClick={() => next()}
      >
        <SkipForward
          className={lg ? 'size-[26px]' : 'size-5'}
          fill="currentColor"
          aria-hidden
        />
      </PlayerIconButton>
      <PlayerIconButton
        aria-label={`Avancer de ${SKIP_SECONDS} secondes`}
        className={cn(lg && 'size-12 text-ink')}
        onClick={() => skipBy(SKIP_SECONDS)}
      >
        <SkipIcon direction="forward" size={lg ? 28 : 22} />
      </PlayerIconButton>
    </div>
  );
}
