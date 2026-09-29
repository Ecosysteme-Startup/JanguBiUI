'use client';

import { Gauge, Laptop, Moon, Volume1, Volume2, VolumeX } from 'lucide-react';

import {
  Menu,
  MenuContent,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu';
import { formatRate } from '@/lib/player/format';
import {
  selectRate,
  SLEEP_MINUTES,
  SPEEDS,
  usePlayerStore,
} from '@/lib/player/player-store';
import type { Quality, SleepTimer } from '@/lib/player/types';
import { cn } from '@/utils/cn';

import { PlayerIconButton } from './player-controls';

function speedName(rate: number): string {
  return rate === 1 ? 'normale' : formatRate(rate);
}

/** Vitesse segmentée 0,75× · 1× · 1,25× · 1,5× (lecteur déployé). */
export function SpeedSegmented({ className }: { className?: string }) {
  const rate = usePlayerStore(selectRate);
  const setRate = usePlayerStore((s) => s.setRate);
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const i = SPEEDS.findIndex((r) => r === rate);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setRate(SPEEDS[Math.min(SPEEDS.length - 1, i + 1)]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setRate(SPEEDS[Math.max(0, i - 1)]);
    }
  };
  return (
    <span
      className={cn(
        'flex items-center gap-2.5 text-13 font-medium text-ink-3',
        className,
      )}
    >
      <span id="jb-player-speed">Vitesse</span>
      <div
        role="radiogroup"
        aria-labelledby="jb-player-speed"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="inline-flex gap-0.5 rounded-[10px] bg-surface-2 p-[3px] tabular-nums"
      >
        {SPEEDS.map((r) => {
          const checked = r === rate;
          return (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => setRate(r)}
              className={cn(
                'inline-flex h-8 items-center rounded-lg px-2.5 text-13 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                checked
                  ? 'bg-surface font-semibold text-ink shadow-card'
                  : 'font-medium text-ink-3 hover:text-ink',
              )}
            >
              {formatRate(r)}
            </button>
          );
        })}
      </div>
    </span>
  );
}

/** Pastille « 1× » de la barre : fait tourner les vitesses. */
export function SpeedCycleButton() {
  const rate = usePlayerStore(selectRate);
  const cycleRate = usePlayerStore((s) => s.cycleRate);
  return (
    <button
      type="button"
      onClick={cycleRate}
      aria-label={`Vitesse de lecture : ${speedName(rate)}`}
      className="mr-1 inline-flex h-8 items-center rounded-lg border border-line px-2 text-13 font-semibold tabular-nums text-ink hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {formatRate(rate)}
    </button>
  );
}

function sleepValue(sleep: SleepTimer): string {
  if (sleep.mode === 'minutes') return String(sleep.minutes);
  return sleep.mode;
}

export function sleepLabel(sleep: SleepTimer): string {
  if (sleep.mode === 'fin_piste') return 'fin de la piste';
  if (sleep.mode === 'minutes') {
    const end = new Date(sleep.endsAt).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `arrêt à ${end}`;
  }
  return 'désactivée';
}

const pill =
  'inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-[10px] border border-line bg-surface px-3 text-14 font-medium text-ink hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50';

/** Minuterie : 15, 30, 45 min ou fin de la piste ; fondu de 10 s à l'arrêt. */
export function SleepMenu() {
  const sleep = usePlayerStore((s) => s.sleep);
  const setSleep = usePlayerStore((s) => s.setSleep);
  return (
    <Menu>
      <MenuTrigger className={pill}>
        <Moon className="size-4" aria-hidden />
        Minuterie : {sleepLabel(sleep)}
      </MenuTrigger>
      <MenuContent align="start" className="z-[70]">
        <MenuLabel>Arrêter la lecture</MenuLabel>
        <MenuSeparator />
        <MenuRadioGroup
          value={sleepValue(sleep)}
          onValueChange={(v: string) => {
            if (v === 'off') setSleep({ mode: 'off' });
            else if (v === 'fin_piste') setSleep({ mode: 'fin_piste' });
            else setSleep({ mode: 'minutes', minutes: Number(v) });
          }}
        >
          <MenuRadioItem value="off">Désactivée</MenuRadioItem>
          {SLEEP_MINUTES.map((m) => (
            <MenuRadioItem key={m} value={String(m)}>
              Dans {m} min
            </MenuRadioItem>
          ))}
          <MenuRadioItem value="fin_piste">À la fin de la piste</MenuRadioItem>
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

const QUALITY_LABELS: Record<Quality, string> = {
  auto: 'Auto',
  economie: 'Économie de données',
  haute: 'Haute',
};

/** Qualité : Auto (ABR), Économie de données (32 kb/s), Haute (128 kb/s). */
export function QualityMenu() {
  const quality = usePlayerStore((s) => s.quality);
  const bitrate = usePlayerStore((s) => s.bitrate);
  const selectable = usePlayerStore((s) => s.qualitySelectable);
  const setQuality = usePlayerStore((s) => s.setQuality);
  const suffix = bitrate ? ` · ${bitrate} kb/s` : '';
  return (
    <Menu>
      <MenuTrigger className={pill}>
        <Gauge className="size-4" aria-hidden />
        Qualité : {QUALITY_LABELS[quality]}
        {suffix}
      </MenuTrigger>
      <MenuContent align="start" className="z-[70]">
        <MenuLabel>Qualité d’écoute</MenuLabel>
        <MenuSeparator />
        <MenuRadioGroup
          value={quality}
          onValueChange={(v: string) => setQuality(v as Quality)}
        >
          <MenuRadioItem value="auto">Auto (selon la connexion)</MenuRadioItem>
          <MenuRadioItem value="economie" disabled={!selectable}>
            Économie de données (32 kb/s)
          </MenuRadioItem>
          <MenuRadioItem value="haute" disabled={!selectable}>
            Haute (128 kb/s)
          </MenuRadioItem>
        </MenuRadioGroup>
        {!selectable && (
          <p className="max-w-60 px-2 pb-1.5 pt-1 text-13 text-ink-3">
            Sur ce navigateur, la qualité s’adapte seule à la connexion.
          </p>
        )}
      </MenuContent>
    </Menu>
  );
}

/** Sortie audio : le web ne choisit pas l'appareil, il l'indique. */
export function OutputLabel() {
  return (
    <span className={cn(pill, 'cursor-default hover:bg-surface')}>
      <Laptop className="size-4" aria-hidden />
      Cet ordinateur
    </span>
  );
}

/** Couper le son + curseur de volume (curseur natif, accessible). */
export function VolumeControl({
  width = 84,
  className,
}: {
  width?: number;
  className?: string;
}) {
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const effective = muted ? 0 : volume;
  const Icon = effective === 0 ? VolumeX : effective < 0.5 ? Volume1 : Volume2;
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <PlayerIconButton
        aria-label={muted ? 'Rétablir le son' : 'Couper le son'}
        aria-pressed={muted}
        onClick={toggleMute}
      >
        <Icon className="size-5" aria-hidden />
      </PlayerIconButton>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(effective * 100)}
        onChange={(e) => setVolume(Number(e.target.value) / 100)}
        aria-label="Volume"
        aria-valuetext={`${Math.round(effective * 100)} %`}
        className="h-1 cursor-pointer accent-foreground"
        style={{ width }}
      />
    </span>
  );
}
