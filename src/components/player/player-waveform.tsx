'use client';

import { useMemo, useRef, useState } from 'react';

import { playerMotion } from '@/lib/motion/tokens';
import { useMotionOK } from '@/lib/motion/use-motion-ok';
import {
  downsamplePeaks,
  formatClock,
  positionValueText,
} from '@/lib/player/format';
import { usePlayerStore } from '@/lib/player/player-store';
import { SKIP_SECONDS } from '@/lib/player/use-player-shortcuts';
import { cn } from '@/utils/cn';

/** Barres sous le doigt pendant le glissé (7 barres à 1,18). */
const GRAB_RADIUS = 3;
const GRAB_SCALE = 1.18;

interface PlayerWaveformProps {
  /** 84 barres dans le lecteur déployé, 90 fines dans la barre. */
  bars: number;
  /** Hauteur de la zone (px). */
  height: number;
  gap?: number;
  className?: string;
  /** Bulle de temps au-dessus du doigt pendant le glissé. */
  showBubble?: boolean;
}

/**
 * Forme d'onde cliquable et glissable, construite depuis les 200 pics du
 * contrat (`waveform` de `lecture/`). C'est un curseur accessible :
 * `role="slider"`, valeur en minutes et secondes (`aria-valuetext`), flèches
 * ±15 s, Page préc./suiv. ±60 s, Début / Fin.
 *
 * Barres jouées en `primary`, restantes en gris (lineField, 3,2:1). Le curseur
 * de 2 px glisse linéairement entre deux relevés (onde.pas, 1 s) par
 * `transform` ; en mouvement réduit, il saute sans glisser.
 */
export function PlayerWaveform({
  bars,
  height,
  gap = 2,
  className,
  showBubble = false,
}: PlayerWaveformProps) {
  const ok = useMotionOK();
  const peaks = usePlayerStore((s) => s.waveform);
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const playing = usePlayerStore((s) => s.status === 'playing');
  const seek = usePlayerStore((s) => s.seek);

  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const lastRatio = useRef(0);

  const levels = useMemo(() => downsamplePeaks(peaks, bars), [peaks, bars]);
  const safeDuration = duration > 0 ? duration : 0;
  const ratio =
    drag ?? (safeDuration > 0 ? Math.min(1, position / safeDuration) : 0);
  const playedBars = Math.round(ratio * bars);
  const dragIndex = drag == null ? -1 : Math.floor(drag * bars);

  // Glissement linéaire seulement pour une avance normale de lecture.
  const jump = Math.abs(ratio - lastRatio.current) * safeDuration > 2;
  const glide = ok && playing && drag == null && !jump;
  lastRatio.current = ratio;

  const ratioAt = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (safeDuration <= 0 || e.button > 0) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // jsdom
    }
    e.currentTarget.focus();
    setDrag(ratioAt(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag == null) return;
    setDrag(ratioAt(e.clientX));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag == null) return;
    const r = ratioAt(e.clientX);
    setDrag(null);
    seek(r * safeDuration);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = {
      ArrowLeft: -SKIP_SECONDS,
      ArrowDown: -SKIP_SECONDS,
      ArrowRight: SKIP_SECONDS,
      ArrowUp: SKIP_SECONDS,
      PageDown: -60,
      PageUp: 60,
    };
    if (e.key in steps) {
      e.preventDefault();
      seek(position + steps[e.key]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      seek(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      seek(Math.max(0, safeDuration - 1));
    }
  };

  const shown = drag != null ? drag * safeDuration : position;

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="Position dans la piste"
      aria-valuemin={0}
      aria-valuemax={Math.round(safeDuration)}
      aria-valuenow={Math.round(shown)}
      aria-valuetext={positionValueText(shown, safeDuration)}
      className={cn(
        'relative flex cursor-pointer touch-none select-none items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
        className,
      )}
      style={{ height, gap }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDrag(null)}
      onKeyDown={onKeyDown}
    >
      {levels.map((level, i) => {
        const grabbed =
          dragIndex >= 0 && Math.abs(i - dragIndex) <= GRAB_RADIUS;
        return (
          <span
            key={i}
            aria-hidden
            data-played={i < playedBars ? 'true' : undefined}
            className={cn(
              'min-w-0 flex-1 rounded-[2px]',
              i < playedBars ? 'bg-primary-fill' : 'bg-ink-4',
            )}
            style={{
              height: `${Math.max(12, Math.round(level * 100))}%`,
              transform: grabbed ? `scaleY(${GRAB_SCALE})` : undefined,
              transition: ok ? 'transform 120ms linear' : undefined,
            }}
          />
        );
      })}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          transform: `translateX(${ratio * 100}%)`,
          transition: glide
            ? `transform ${playerMotion.waveStep}s linear`
            : undefined,
        }}
      >
        <span className="absolute -inset-y-1 left-0 -ml-px w-0.5 rounded-full bg-ink" />
        {showBubble && drag != null && (
          <span className="absolute -top-9 left-0 -translate-x-1/2 rounded-md bg-ink px-2 py-0.5 text-13 font-semibold tabular-nums text-paper shadow-card">
            {formatClock(shown)}
          </span>
        )}
      </span>
    </div>
  );
}
