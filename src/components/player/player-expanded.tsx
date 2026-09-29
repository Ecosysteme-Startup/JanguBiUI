'use client';

import { ChevronDown, Heart, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';

import { Link } from '@/components/ui/link/link';
import { KenBurns } from '@/lib/motion/ken-burns';
import { easings, playerMotion, springs } from '@/lib/motion/tokens';
import { useMotionOK } from '@/lib/motion/use-motion-ok';
import { formatClock, formatRemaining } from '@/lib/player/format';
import { coverOf, usePlayerStore } from '@/lib/player/player-store';
import { cn } from '@/utils/cn';

import { PlayerAbout } from './player-about';
import { COVER_LAYOUT_ID } from './player-bar';
import { PlayerIconButton, TransportControls } from './player-controls';
import { PlayerCover } from './player-cover';
import {
  OutputLabel,
  QualityMenu,
  SleepMenu,
  SpeedSegmented,
  VolumeControl,
} from './player-options';
import { PlayerQueue } from './player-queue';
import { PlayerWaveform } from './player-waveform';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/** Piège de focus + retour au bouton d'origine à la fermeture. */
function useFocusTrap(ref: React.RefObject<HTMLElement>, active: boolean) {
  useEffect(() => {
    // Pendant le fondu de sortie, le panneau n'est plus actif : on rend le
    // focus tout de suite, sans attendre la fin de l'animation.
    if (!active) return;
    const origin = document.activeElement as HTMLElement | null;
    const root = ref.current;
    root?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !root) return;
      const items = Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !root.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      if (origin && document.contains(origin)) origin.focus();
    };
  }, [ref, active]);
}

function Times() {
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  return (
    <div className="mt-2 flex justify-between text-[13px] font-medium leading-[18px] tabular-nums text-muted-foreground">
      <span>{formatClock(position)}</span>
      <span>{formatRemaining(position, duration)}</span>
    </div>
  );
}

/**
 * Lecteur déployé (WEB-FID-Lecteur) : panneau plein écran en trois colonnes
 * — le lecteur (pochette 440, onde 84 barres), la file, « À propos » — et une
 * barre d'options en bas. La pochette est partagée avec la barre (`layoutId`,
 * ressort 18 / 0,7 / 190) ; le fond apparaît en 240 ms ; titre, onde,
 * commandes, options, file puis « À propos » arrivent avec 40 ms d'écart.
 * Mouvement réduit : un seul fondu de 120 ms, fond fixe.
 */
export function PlayerExpanded() {
  const ok = useMotionOK();
  const ref = useRef<HTMLDivElement>(null);
  const current = usePlayerStore((s) => s.current);
  const status = usePlayerStore((s) => s.status);
  const context = usePlayerStore((s) => s.context);
  const liked = usePlayerStore((s) =>
    s.current ? !!s.liked[s.current.id] : false,
  );
  const collapse = usePlayerStore((s) => s.collapse);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const errorMessage = usePlayerStore((s) => s.errorMessage);
  const open = usePlayerStore((s) => s.expanded);
  useFocusTrap(ref, open);

  if (!current) return null;
  const playing = status === 'playing' || status === 'loading';
  const cover = coverOf(current);

  const rise = (i: number) =>
    ok
      ? {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: playerMotion.controlsDuration,
            ease: easings.outCubic,
            delay: playerMotion.controlsDelay + i * playerMotion.controlsStep,
          },
        }
      : {};

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={`Lecteur : ${current.title}`}
      aria-hidden={open ? undefined : true}
      className={cn(
        'fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-background text-foreground',
        !open && 'pointer-events-none',
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: ok ? playerMotion.backdrop : playerMotion.reduced,
        ease: ok ? easings.outCubic : 'linear',
      }}
    >
      {/* Fond : pochette floutée sous un voile papier à 88 %, Ken Burns 20 s. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden bg-muted"
      >
        {cover && (
          <KenBurns className="absolute inset-0">
            <img
              src={cover}
              alt=""
              className="size-full object-cover blur-[60px]"
            />
          </KenBurns>
        )}
        <div className="absolute inset-0 bg-background/[0.88]" />
      </div>

      <div className="relative flex min-h-full flex-col">
        <header className="grid h-[72px] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 md:pl-10 md:pr-8">
          <button
            type="button"
            data-autofocus
            onClick={collapse}
            className="inline-flex h-10 items-center gap-1.5 justify-self-start rounded-xl border border-border bg-card pl-2.5 pr-3.5 text-[15px] font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronDown className="size-5" aria-hidden />
            Réduire
          </button>
          <div className="hidden text-center text-sm leading-5 text-muted-foreground sm:block">
            {context ? (
              <>
                Lecture depuis{' '}
                {context.kindLabel ? `${context.kindLabel} ` : ''}
                {context.href ? (
                  <Link
                    href={context.href}
                    onClick={collapse}
                    className="font-semibold text-foreground hover:underline"
                  >
                    {context.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-foreground">
                    {context.label}
                  </span>
                )}
              </>
            ) : current.album ? (
              <>
                Lecture depuis l’album{' '}
                <span className="font-semibold text-foreground">
                  {current.album.title}
                </span>
              </>
            ) : null}
          </div>
          <PlayerIconButton
            aria-label="Fermer le lecteur (Échap)"
            onClick={collapse}
            className="justify-self-end text-foreground"
          >
            <X className="size-5" aria-hidden />
          </PlayerIconButton>
        </header>

        <div className="grid flex-1 items-start gap-10 px-4 pb-8 pt-4 md:px-12 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)_minmax(0,1fr)]">
          {/* Colonne 1 : le lecteur */}
          <div className="mx-auto flex w-full min-w-0 max-w-[440px] flex-col">
            <motion.div
              layoutId={COVER_LAYOUT_ID}
              transition={springs.indicator}
              className="aspect-square w-full overflow-hidden rounded-2xl shadow-soft-lg"
            >
              <motion.div
                className="size-full"
                initial={false}
                animate={{
                  scale: playing || !ok ? 1 : playerMotion.coverPausedScale,
                }}
                transition={springs.indicator}
              >
                <PlayerCover
                  track={current}
                  className="size-full"
                  crossfade
                  alt={
                    current.album
                      ? `Pochette de l’album ${current.album.title}`
                      : ''
                  }
                />
              </motion.div>
            </motion.div>

            <motion.div className="mt-6 flex items-start gap-2" {...rise(0)}>
              <div className="min-w-0 flex-1">
                <h1 className="font-serif text-[28px] font-semibold leading-[34px] tracking-[-0.01em]">
                  {current.title}
                </h1>
                <p
                  className={cn(
                    'mt-1 text-base font-medium leading-[22px]',
                    errorMessage ? 'text-destructive' : 'text-primary',
                  )}
                >
                  {errorMessage ??
                    current.source?.name ??
                    current.performers[0]}
                </p>
              </div>
              <PlayerIconButton
                aria-label={
                  liked
                    ? 'Retirer des titres aimés'
                    : 'Ajouter aux titres aimés'
                }
                aria-pressed={liked}
                className={cn(
                  'size-11',
                  liked ? 'text-primary' : 'text-foreground',
                )}
                onClick={() => toggleLike()}
              >
                <Heart
                  className="size-[22px]"
                  fill={liked ? 'currentColor' : 'none'}
                  aria-hidden
                />
              </PlayerIconButton>
            </motion.div>

            <motion.div className="mt-[18px]" {...rise(1)}>
              <PlayerWaveform bars={84} height={40} gap={2} showBubble />
              <Times />
            </motion.div>

            <motion.div className="mt-2.5" {...rise(2)}>
              <TransportControls size="lg" />
            </motion.div>
          </div>

          {/* Colonnes 2 et 3 : file, puis « À propos » */}
          <motion.div className="min-w-0" {...rise(4)}>
            <PlayerQueue />
          </motion.div>
          <motion.div className="min-w-0" {...rise(5)}>
            <PlayerAbout />
          </motion.div>
        </div>

        {/* Barre d'options */}
        <motion.div
          className="relative z-10 mx-4 mb-4 md:sticky md:bottom-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-soft-sm md:mx-12 md:mb-6 md:min-h-14 md:pl-5"
          {...rise(3)}
        >
          <SpeedSegmented />
          <span aria-hidden className="hidden h-6 w-px bg-border md:block" />
          <SleepMenu />
          <QualityMenu />
          <span className="hidden md:inline-flex">
            <OutputLabel />
          </span>
          <span className="flex-1" />
          <VolumeControl width={120} />
        </motion.div>
      </div>
    </motion.div>
  );
}
