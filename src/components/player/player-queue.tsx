'use client';

import {
  Infinity as InfinityIcon,
  Repeat,
  Repeat1,
  Shuffle,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Equalizer } from '@/lib/motion/equalizer';
import { formatClock, formatRate } from '@/lib/player/format';
import { speedBucket, usePlayerStore } from '@/lib/player/player-store';
import type { Track } from '@/lib/player/types';
import { cn } from '@/utils/cn';

import { PlayerIconButton } from './player-controls';
import { PlayerCover } from './player-cover';

const VISIBLE_NEXT = 3;

function SectionTitle({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between px-5 pb-1.5 pt-4">
      <h3 className="text-[13px] font-medium leading-[18px] text-muted-foreground">
        {children}
      </h3>
      {aside}
    </div>
  );
}

function QueueRow({
  track,
  subtitle,
  reason,
  current = false,
  playing = false,
  onPlay,
  onRemove,
}: {
  track: Track;
  subtitle?: string;
  reason?: string | null;
  current?: boolean;
  playing?: boolean;
  onPlay?: () => void;
  onRemove?: () => void;
}) {
  return (
    <li className={cn('group flex items-center', current && 'bg-secondary/60')}>
      <button
        type="button"
        onClick={onPlay}
        disabled={!onPlay}
        aria-current={current ? 'true' : undefined}
        className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-5 pr-2 text-left hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary disabled:cursor-default disabled:hover:bg-transparent"
      >
        <PlayerCover track={track} className="size-10 shrink-0 rounded-md" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-2 text-sm font-semibold leading-5 text-foreground">
            {current && (
              <Equalizer playing={playing} className="h-3 text-primary" />
            )}
            <span className="truncate">{track.title}</span>
          </span>
          {subtitle && (
            <span className="truncate text-[13px] leading-[18px] text-muted-foreground">
              {subtitle}
            </span>
          )}
          {reason && (
            <span className="truncate text-[13px] font-medium leading-[18px] text-secondary-foreground">
              {reason}
            </span>
          )}
        </span>
        <span className="shrink-0 text-[13px] tabular-nums text-muted-foreground">
          {formatClock(track.duration_seconds)}
        </span>
      </button>
      {onRemove && (
        <PlayerIconButton
          aria-label={`Retirer « ${track.title} » de la file`}
          className="mr-2 size-8 opacity-70 group-hover:opacity-100"
          onClick={onRemove}
        >
          <X className="size-4" aria-hidden />
        </PlayerIconButton>
      )}
    </li>
  );
}

function sourceLine(track: Track): string {
  return track.source?.name ?? track.performers[0] ?? '';
}

function totalMinutes(tracks: Track[]): number {
  return Math.round(
    tracks.reduce((sum, t) => sum + (t.duration_seconds || 0), 0) / 60,
  );
}

/** Aléatoire, répéter, lecture en continu (en-tête de la file ou onglets du panneau). */
export function QueueModeButtons({ className }: { className?: string }) {
  const m = usePlayerStore(
    useShallow((st) => ({
      shuffle: st.shuffle,
      repeat: st.repeat,
      autoplay: st.autoplay,
      toggleShuffle: st.toggleShuffle,
      cycleRepeat: st.cycleRepeat,
      toggleAutoplay: st.toggleAutoplay,
    })),
  );
  const repeatLabel =
    m.repeat === 'one'
      ? 'cette piste'
      : m.repeat === 'all'
        ? 'toute la file'
        : 'désactivé';
  return (
    <span className={cn('flex gap-0.5', className)}>
      <PlayerIconButton
        aria-label="Lecture aléatoire"
        aria-pressed={m.shuffle}
        active={m.shuffle}
        onClick={m.toggleShuffle}
      >
        <Shuffle className="size-[18px]" aria-hidden />
      </PlayerIconButton>
      <PlayerIconButton
        aria-label={`Répéter : ${repeatLabel}`}
        aria-pressed={m.repeat !== 'off'}
        active={m.repeat !== 'off'}
        onClick={m.cycleRepeat}
      >
        {m.repeat === 'one' ? (
          <Repeat1 className="size-[18px]" aria-hidden />
        ) : (
          <Repeat className="size-[18px]" aria-hidden />
        )}
      </PlayerIconButton>
      <PlayerIconButton
        aria-label={`Lecture en continu : ${m.autoplay ? 'activée' : 'désactivée'}`}
        aria-pressed={m.autoplay}
        active={m.autoplay}
        onClick={m.toggleAutoplay}
      >
        <InfinityIcon className="size-[18px]" aria-hidden />
      </PlayerIconButton>
    </span>
  );
}

/** File d'attente (colonne du lecteur déployé). */
export function PlayerQueue({
  className,
  bare = false,
}: {
  className?: string;
  /** Panneau latéral : sans carte ni en-tête (les boutons sont dans les onglets). */
  bare?: boolean;
}) {
  // Pas de `position` ici : la file ne se redessine pas à chaque relevé.
  const s = usePlayerStore(
    useShallow((st) => ({
      current: st.current,
      status: st.status,
      tracks: st.tracks,
      order: st.order,
      cursor: st.cursor,
      context: st.context,
      upNext: st.upNext,
      recommendations: st.recommendations,
      rates: st.rates,
      autoplay: st.autoplay,
      clearUpNext: st.clearUpNext,
      playFromUpNext: st.playFromUpNext,
      removeFromUpNext: st.removeFromUpNext,
      jumpTo: st.jumpTo,
      playRecommendation: st.playRecommendation,
    })),
  );
  const [showAll, setShowAll] = useState(false);
  if (!s.current) return null;

  const playing = s.status === 'playing' || s.status === 'loading';
  const following = s.order
    .slice(s.cursor + 1)
    .map((i) => ({ track: s.tracks[i] }));
  const withPositions = s.order
    .map((trackIndex, orderPos) => ({ track: s.tracks[trackIndex], orderPos }))
    .slice(s.cursor + 1);
  const visible = showAll
    ? withPositions
    : withPositions.slice(0, VISIBLE_NEXT);
  const inAlbum = !s.context || /album/i.test(s.context.kindLabel ?? 'album');

  const upNextSubtitle = (t: Track) => {
    const rate = s.rates[speedBucket(t)];
    const parts = [
      t.performers[0] ?? sourceLine(t),
      ...(t.readings ?? []).slice(0, 1),
    ];
    // « vitesse retenue » : la vitesse mémorisée pour ce type de contenu.
    if (rate !== 1) parts.push(formatRate(rate));
    return parts.filter(Boolean).join(' · ');
  };

  return (
    <section
      aria-label="File d'attente"
      className={cn(
        !bare &&
          'overflow-hidden rounded-2xl border border-border bg-card shadow-soft-sm',
        className,
      )}
    >
      {!bare && (
        <div className="flex items-center justify-between px-5 pb-1 pt-[18px]">
          <h2 className="font-sans text-lg font-semibold leading-[26px] tracking-normal">
            File d’attente
          </h2>
          <QueueModeButtons />
        </div>
      )}

      <SectionTitle>En cours</SectionTitle>
      <ul>
        <QueueRow
          track={s.current}
          subtitle={sourceLine(s.current)}
          current
          playing={playing}
        />
      </ul>

      {s.upNext.length > 0 && (
        <>
          <SectionTitle
            aside={
              <button
                type="button"
                onClick={s.clearUpNext}
                className="text-sm font-medium text-primary hover:underline"
              >
                Effacer
              </button>
            }
          >
            À suivre · ajoutée par vous
          </SectionTitle>
          <ul>
            {s.upNext.map((t, i) => (
              <QueueRow
                key={`${t.id}-${i}`}
                track={t}
                subtitle={upNextSubtitle(t)}
                onPlay={() => s.playFromUpNext(i)}
                onRemove={() => s.removeFromUpNext(i)}
              />
            ))}
          </ul>
        </>
      )}

      {following.length > 0 && (
        <>
          <SectionTitle
            aside={
              <span className="text-[13px] tabular-nums text-muted-foreground">
                {following.length} piste{following.length > 1 ? 's' : ''} ·{' '}
                {totalMinutes(following.map((f) => f.track))} min
              </span>
            }
          >
            {inAlbum ? 'Ensuite dans l’album' : 'Ensuite dans la file'}
          </SectionTitle>
          <ul className="divide-y divide-border [&>li]:ml-0">
            {visible.map(({ track, orderPos }) => (
              <QueueRow
                key={`${track.id}-${orderPos}`}
                track={track}
                subtitle={[
                  track.position ? `Piste ${track.position}` : null,
                  track.performers[0] &&
                  track.performers[0] !== sourceLine(track)
                    ? track.performers[0]
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                onPlay={() => s.jumpTo(orderPos)}
              />
            ))}
          </ul>
          {withPositions.length > VISIBLE_NEXT && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="block px-5 pb-1 pl-[72px] pt-2 text-sm font-medium text-primary hover:underline"
            >
              {showAll
                ? 'Afficher moins'
                : `Voir les ${withPositions.length - VISIBLE_NEXT} autres pistes`}
            </button>
          )}
        </>
      )}

      {s.recommendations.length > 0 && (
        <>
          <div className="mx-5 mt-3 h-px bg-border" />
          <div className="flex items-center justify-between px-5 pb-0.5 pt-4">
            <h3 className="text-base font-semibold leading-[22px]">
              À écouter ensuite
            </h3>
            <span className="text-[13px] text-muted-foreground">
              Lecture automatique {s.autoplay ? 'activée' : 'désactivée'}
            </span>
          </div>
          <p className="px-5 pb-1.5 text-[13px] leading-[18px] text-muted-foreground">
            À la fin de la file, d’après ce que vous écoutez.
          </p>
          <ul>
            {s.recommendations.map((t, i) => (
              <QueueRow
                key={t.id}
                track={t}
                subtitle={sourceLine(t)}
                reason={t.reason}
                onPlay={() => s.playRecommendation(i)}
              />
            ))}
          </ul>
        </>
      )}
      <div className="h-3" />
    </section>
  );
}
