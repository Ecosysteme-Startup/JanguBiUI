'use client';

import {
  Heart,
  ListMusic,
  PanelRightClose,
  PanelRightOpen,
  SkipForward,
} from 'lucide-react';
import { motion } from 'motion/react';

import { Equalizer } from '@/lib/motion/equalizer';
import { pressProps } from '@/lib/motion/press-scale';
import { springs } from '@/lib/motion/tokens';
import { useMotionOK } from '@/lib/motion/use-motion-ok';
import { formatClock, formatRemaining } from '@/lib/player/format';
import { usePlayerStore } from '@/lib/player/player-store';
import { cn } from '@/utils/cn';

import { PlayPauseIcon } from './play-pause-icon';
import { PlayerIconButton, TransportControls } from './player-controls';
import { PlayerCover } from './player-cover';
import { SpeedCycleButton, VolumeControl } from './player-options';
import { PlayerReserve } from './player-reserve';
import { PlayerWaveform } from './player-waveform';

export const COVER_LAYOUT_ID = 'jb-player-cover';

/** Hauteur de la barre : 88 px (bureau), 64 px au-dessus de la bottom-nav. */
export const BAR_HEIGHT_DESKTOP = 88;
export const BAR_HEIGHT_MOBILE = 64;

function MobileProgress() {
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const ratio = duration > 0 ? Math.min(1, position / duration) : 0;
  return (
    <span
      aria-hidden
      className="absolute inset-x-0 top-0 h-0.5 bg-line md:hidden"
    >
      <span
        className="absolute inset-0 origin-left bg-primary-fill"
        style={{ transform: `scaleX(${ratio})` }}
      />
    </span>
  );
}

function useBarTimes() {
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  return {
    position: formatClock(position),
    remaining: formatRemaining(position, duration),
  };
}

function BarWaveformRow() {
  const t = useBarTimes();
  return (
    <div className="grid w-full max-w-[520px] grid-cols-[40px_minmax(0,1fr)_44px] items-center gap-2.5 text-13 tabular-nums text-ink-3">
      <span className="text-right">{t.position}</span>
      <PlayerWaveform bars={90} height={18} gap={1} />
      <span>{t.remaining}</span>
    </div>
  );
}

/**
 * Barre de lecture persistante (WEB-FID-Lecteur-Barre) : piste et like ;
 * commandes et onde fine ; vitesse, file, volume et « Agrandir ». Sur mobile,
 * version compacte au-dessus de la barre d'onglets.
 */
export function PlayerBar() {
  const ok = useMotionOK();
  const current = usePlayerStore((s) => s.current);
  const status = usePlayerStore((s) => s.status);
  const errorMessage = usePlayerStore((s) => s.errorMessage);
  const expanded = usePlayerStore((s) => s.expanded);
  const liked = usePlayerStore((s) =>
    s.current ? !!s.liked[s.current.id] : false,
  );
  const expand = usePlayerStore((s) => s.expand);
  const collapse = usePlayerStore((s) => s.collapse);
  const reserve = usePlayerStore((s) => s.reserve);
  const pausedElsewhere = usePlayerStore((s) => s.pausedElsewhere);
  const toggle = usePlayerStore((s) => s.toggle);
  const next = usePlayerStore((s) => s.next);
  const toggleLike = usePlayerStore((s) => s.toggleLike);

  if (!current) return null;
  const playing = status === 'playing' || status === 'loading';
  const togglePanel = expanded ? collapse : expand;
  const subtitle =
    status === 'error' && errorMessage
      ? errorMessage
      : pausedElsewhere
        ? 'En pause : lecture sur un autre appareil'
        : (current.source?.name ?? current.performers[0] ?? '');
  // Contenu réservé : message sobre (pas en rouge), avec l'action.
  const erreurVisible = status === 'error' && !reserve;

  return (
    <div
      role="region"
      aria-label="Lecteur audio"
      className="relative grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-line bg-paper px-3 backdrop-blur-md md:h-[88px] md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] md:gap-6 md:px-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)_minmax(0,340px)]"
    >
      <MobileProgress />

      {/* Zone 1 : piste */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={expand}
          aria-label="Ouvrir le lecteur"
          aria-expanded={expanded}
          className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {expanded ? (
            <span className="block size-11 md:size-14" />
          ) : (
            <motion.div
              layoutId={COVER_LAYOUT_ID}
              transition={springs.indicator}
              className="size-11 overflow-hidden rounded-lg md:size-14"
            >
              <PlayerCover track={current} className="size-full" crossfade />
            </motion.div>
          )}
        </button>
        <button
          type="button"
          onClick={expand}
          className="flex min-w-0 flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="truncate text-15 font-semibold leading-5 text-ink">
            {current.title}
          </span>
          <span
            className={cn(
              'flex min-w-0 items-center gap-1.5 text-13 leading-[18px]',
              erreurVisible ? 'text-err' : 'text-ink-3',
            )}
          >
            {status !== 'error' && !pausedElsewhere && (
              <Equalizer
                playing={status === 'playing'}
                className="h-3 text-primary"
              />
            )}
            <span className="truncate">{subtitle}</span>
          </span>
        </button>
        <PlayerIconButton
          className={cn('hidden md:inline-flex', liked && 'text-primary')}
          aria-label={
            liked ? 'Retirer des titres aimés' : 'Ajouter aux titres aimés'
          }
          aria-pressed={liked}
          onClick={() => toggleLike()}
        >
          <Heart
            className="size-5"
            fill={liked ? 'currentColor' : 'none'}
            aria-hidden
          />
        </PlayerIconButton>
      </div>

      {/* Zone 2 : commandes + onde (bureau) ; lecture + suivant (mobile) */}
      <div className="hidden min-w-0 flex-col items-center gap-1 md:flex">
        {reserve ? (
          <PlayerReserve compact />
        ) : (
          <>
            <TransportControls size="sm" />
            <BarWaveformRow />
          </>
        )}
      </div>
      <div className="flex items-center gap-1 md:hidden">
        <motion.button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Mettre en pause' : 'Reprendre la lecture'}
          className="inline-flex size-11 items-center justify-center rounded-full text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          {...pressProps(ok)}
        >
          <PlayPauseIcon playing={playing} size={24} />
        </motion.button>
        <PlayerIconButton
          aria-label="Piste suivante"
          className="size-11 text-ink"
          onClick={() => next()}
        >
          <SkipForward className="size-5" fill="currentColor" aria-hidden />
        </PlayerIconButton>
      </div>

      {/* Zone 3 : options */}
      <div className="hidden items-center justify-end gap-1 md:flex">
        <SpeedCycleButton />
        <PlayerIconButton
          aria-label={
            expanded
              ? 'File d’attente et lecteur, panneau ouvert'
              : 'File d’attente'
          }
          aria-pressed={expanded}
          active={expanded}
          onClick={togglePanel}
        >
          <ListMusic className="size-5" aria-hidden />
        </PlayerIconButton>
        <VolumeControl className="hidden lg:inline-flex" />
        <PlayerIconButton
          aria-label={
            expanded ? 'Fermer le panneau du lecteur' : 'Agrandir le lecteur'
          }
          aria-expanded={expanded}
          onClick={togglePanel}
        >
          {expanded ? (
            <PanelRightClose className="size-5" aria-hidden />
          ) : (
            <PanelRightOpen className="size-5" aria-hidden />
          )}
        </PlayerIconButton>
      </div>
    </div>
  );
}
