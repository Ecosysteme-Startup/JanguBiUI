'use client';

import { Heart, X } from 'lucide-react';
import { motion, useIsPresent } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';

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
} from './player-options';
import { PlayerQueue, QueueModeButtons } from './player-queue';
import { PlayerReserve } from './player-reserve';
import { PlayerWaveform } from './player-waveform';

/** Largeur du panneau (décision 13, maquette WEB-FID-Lecteur). */
export const PANEL_WIDTH = 440;

type Onglet = 'suivre' | 'propos';

function Times() {
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  return (
    <div className="mt-1.5 flex justify-between text-[13px] font-medium leading-[18px] tabular-nums text-muted-foreground">
      <span>{formatClock(position)}</span>
      <span>{formatRemaining(position, duration)}</span>
    </div>
  );
}

/**
 * Le focus entre dans le panneau à l'ouverture (bouton « Fermer ») et revient
 * au bouton d'origine à la fermeture, seulement s'il était encore dans le
 * panneau : le panneau n'est pas modal (pas de piège de focus), la page et
 * la navigation restent utilisables pendant l'écoute.
 */
function useFocusInOut(ref: React.RefObject<HTMLElement>, active: boolean) {
  useEffect(() => {
    // Au début du glissement de sortie, on rend le focus tout de suite.
    if (!active) return;
    const origin = document.activeElement as HTMLElement | null;
    const root = ref.current;
    root?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => {
      const active = document.activeElement;
      const inside =
        !active || active === document.body || !!root?.contains(active);
      if (inside && origin && document.contains(origin)) origin.focus();
    };
  }, [ref, active]);
}

function PanelTabs({
  value,
  onChange,
  ids,
}: {
  value: Onglet;
  onChange: (v: Onglet) => void;
  ids: Record<Onglet, { tab: string; panel: string }>;
}) {
  const onglets: { v: Onglet; label: string }[] = [
    { v: 'suivre', label: 'À suivre' },
    { v: 'propos', label: 'À propos' },
  ];
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = value === 'suivre' ? 'propos' : 'suivre';
    onChange(next);
    document.getElementById(ids[next].tab)?.focus();
  };
  return (
    <div className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-1 border-b border-border bg-background px-3">
      <div
        role="tablist"
        aria-label="Contenu du panneau"
        tabIndex={-1}
        className="flex h-full items-stretch"
        onKeyDown={onKeyDown}
      >
        {onglets.map(({ v, label }) => {
          const selected = v === value;
          return (
            <button
              key={v}
              id={ids[v].tab}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={ids[v].panel}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(v)}
              className={cn(
                'relative px-3 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                selected
                  ? 'font-semibold text-foreground'
                  : 'font-medium text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
              {selected && (
                <motion.span
                  aria-hidden
                  layoutId="jb-player-panel-tab"
                  transition={springs.indicator}
                  className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>
      <span className="flex-1" />
      {value === 'suivre' && <QueueModeButtons />}
    </div>
  );
}

/**
 * Lecteur déployé en panneau latéral droit (décision 13, maquette
 * WEB-FID-Lecteur) : 440 px, la barre latérale et la page restent visibles et
 * utilisables, la barre de lecture reste en bas. En-tête « Lecture en
 * cours », pochette 156 partagée avec la barre (`layoutId`, ressort
 * 18 / 0,7 / 190), onde, commandes, options, puis onglets « À suivre » et
 * « À propos ». Glissement depuis la droite avec le même ressort ; titre,
 * onde, commandes et options arrivent avec 40 ms d'écart. Mouvement réduit :
 * un seul fondu de 120 ms. Échap ferme le panneau (raccourcis globaux).
 */
export function PlayerPanel() {
  const ok = useMotionOK();
  const ref = useRef<HTMLElement>(null);
  const [onglet, setOnglet] = useState<Onglet>('suivre');
  const uid = useId();
  const ids = {
    suivre: { tab: `${uid}-tab-suivre`, panel: `${uid}-panel-suivre` },
    propos: { tab: `${uid}-tab-propos`, panel: `${uid}-panel-propos` },
  };
  const current = usePlayerStore((s) => s.current);
  const status = usePlayerStore((s) => s.status);
  const context = usePlayerStore((s) => s.context);
  const liked = usePlayerStore((s) =>
    s.current ? !!s.liked[s.current.id] : false,
  );
  const collapse = usePlayerStore((s) => s.collapse);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const errorMessage = usePlayerStore((s) => s.errorMessage);
  const reserve = usePlayerStore((s) => s.reserve);
  const pausedElsewhere = usePlayerStore((s) => s.pausedElsewhere);
  // Pendant le glissement de sortie, le panneau n'est plus interactif ni lu.
  const present = useIsPresent();
  useFocusInOut(ref, present);

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

  const from = context ? (
    <>
      Depuis {context.kindLabel ? `${context.kindLabel} ` : ''}
      {context.href ? (
        <Link
          href={context.href}
          className="font-semibold text-foreground hover:underline"
        >
          {context.label}
        </Link>
      ) : (
        <span className="font-semibold text-foreground">{context.label}</span>
      )}
    </>
  ) : current.album ? (
    <>
      Depuis l’album{' '}
      <span className="font-semibold text-foreground">
        {current.album.title}
      </span>
    </>
  ) : null;

  const sousTitre = reserve
    ? null
    : (errorMessage ??
      (pausedElsewhere
        ? 'En pause : la lecture continue sur un autre appareil.'
        : null));

  return (
    <motion.aside
      ref={ref}
      aria-label={`Lecteur : ${current.title}`}
      aria-hidden={present ? undefined : true}
      inert={present ? undefined : true}
      data-testid="jb-player-panel"
      className={cn(
        'fixed right-0 top-0 z-40 flex w-full flex-col overflow-y-auto overscroll-contain border-l border-border bg-background text-foreground shadow-soft-lg bottom-[124px] md:bottom-[88px] md:w-[440px]',
        !present && 'pointer-events-none',
      )}
      initial={ok ? { x: '100%' } : { opacity: 0 }}
      animate={ok ? { x: 0 } : { opacity: 1 }}
      exit={
        ok
          ? {
              x: '100%',
              transition: {
                duration: playerMotion.backdrop,
                ease: easings.outCubic,
              },
            }
          : { opacity: 0 }
      }
      transition={
        ok
          ? springs.indicator
          : { duration: playerMotion.reduced, ease: 'linear' }
      }
    >
      <div className="relative shrink-0">
        {/* Fond : pochette floutée sous un voile papier à 88 %. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden bg-muted"
        >
          {cover &&
            (ok ? (
              <KenBurns className="absolute inset-0">
                <img
                  src={cover}
                  alt=""
                  className="size-full scale-125 object-cover blur-2xl"
                />
              </KenBurns>
            ) : (
              <img
                src={cover}
                alt=""
                className="absolute inset-0 size-full scale-125 object-cover blur-2xl"
              />
            ))}
          <div className="absolute inset-0 bg-background/[0.88]" />
        </div>

        <header className="relative flex h-16 items-center gap-2 border-b border-border pl-6 pr-3">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] font-semibold leading-5">
              Lecture en cours
            </span>
            {from && (
              <span className="truncate text-[13px] leading-[18px] text-muted-foreground">
                {from}
              </span>
            )}
          </span>
          <PlayerIconButton
            data-autofocus
            aria-label="Fermer le panneau (Échap)"
            onClick={collapse}
            className="text-foreground"
          >
            <X className="size-5" aria-hidden />
          </PlayerIconButton>
        </header>

        <div className="relative px-6 pb-4 pt-5">
          <div className="flex items-end gap-4">
            <motion.div
              layoutId={COVER_LAYOUT_ID}
              transition={springs.indicator}
              className="size-[156px] shrink-0 overflow-hidden rounded-xl shadow-soft-lg"
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
            <motion.div className="flex min-w-0 flex-1 flex-col" {...rise(0)}>
              <h2 className="font-serif text-[22px] font-semibold leading-7 tracking-[-0.01em]">
                {current.title}
              </h2>
              <p className="mt-1 text-sm font-medium leading-5 text-primary">
                {current.source?.name ?? current.performers[0]}
              </p>
              <span className="-ml-2.5 mt-2 flex">
                <PlayerIconButton
                  aria-label={
                    liked
                      ? 'Retirer des titres aimés'
                      : 'Ajouter aux titres aimés'
                  }
                  aria-pressed={liked}
                  className={cn(liked ? 'text-primary' : 'text-foreground')}
                  onClick={() => toggleLike()}
                >
                  <Heart
                    className="size-5"
                    fill={liked ? 'currentColor' : 'none'}
                    aria-hidden
                  />
                </PlayerIconButton>
              </span>
            </motion.div>
          </div>

          {reserve && <PlayerReserve className="mt-4" />}
          {sousTitre && (
            <p
              role="status"
              className={cn(
                'mt-3 text-sm',
                errorMessage ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {sousTitre}
            </p>
          )}

          <motion.div className="mt-4" {...rise(1)}>
            <PlayerWaveform bars={72} height={36} gap={2} showBubble />
            <Times />
          </motion.div>

          <motion.div className="mt-1.5" {...rise(2)}>
            <TransportControls size="lg" className="px-2" />
          </motion.div>

          <motion.div
            className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2"
            {...rise(3)}
          >
            <SpeedSegmented />
            <SleepMenu />
            <QualityMenu />
            <OutputLabel />
          </motion.div>
        </div>
      </div>

      <PanelTabs value={onglet} onChange={setOnglet} ids={ids} />
      <div
        id={ids.suivre.panel}
        role="tabpanel"
        aria-labelledby={ids.suivre.tab}
        hidden={onglet !== 'suivre'}
        className="pb-3"
      >
        {onglet === 'suivre' && <PlayerQueue bare />}
      </div>
      <div
        id={ids.propos.panel}
        role="tabpanel"
        aria-labelledby={ids.propos.tab}
        hidden={onglet !== 'propos'}
        className="pb-3"
      >
        {onglet === 'propos' && <PlayerAbout bare />}
      </div>
    </motion.aside>
  );
}
