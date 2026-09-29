'use client';

import { Lock, Play } from 'lucide-react';
import type { ReactNode } from 'react';

import { Equalizer } from '@/lib/motion/equalizer';
import { cn } from '@/utils/cn';

import { usePlayTracks } from '../play';
import type { Track } from '../types/schemas';

import { Pochette } from './pochette';

interface LignePisteProps {
  pistes: Track[];
  index: number;
  sousTitre?: ReactNode;
  /** Raison d'une suggestion (« Parce que vous avez écouté… »). */
  raison?: ReactNode;
  fin?: ReactNode;
  className?: string;
}

/** Ligne compacte : pochette 52, titre, sous-titre, raison, bouton Lire. */
export function LignePiste({
  pistes,
  index,
  sousTitre,
  raison,
  fin,
  className,
}: LignePisteProps) {
  const { playTracks, currentTrackId, isPlaying } = usePlayTracks();
  const piste = pistes[index];
  const enCours = piste.id === currentTrackId;
  return (
    <div
      className={cn(
        'flex items-center gap-3.5 px-4 py-3 hover:bg-background-surface',
        className,
      )}
    >
      <Pochette
        titre={piste.album?.title ?? piste.source.name}
        genre={piste.album?.kind ?? piste.source.kind}
        temps={piste.liturgical_season}
        className="size-[52px]"
        monoClassName="text-sm"
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-[15px] font-semibold',
            enCours ? 'text-primary' : 'text-foreground',
          )}
        >
          {piste.title}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {sousTitre ?? piste.source.name}
        </p>
        {raison && (
          <p className="mt-0.5 text-[13px] font-medium text-primary md:hidden">
            {raison}
          </p>
        )}
      </div>
      {raison && (
        <p className="hidden w-60 shrink-0 text-[13px] font-medium leading-snug text-primary md:block">
          {raison}
        </p>
      )}
      {fin}
      {piste.verrouille ? (
        <span
          role="img"
          aria-label={`${piste.title} : réservé aux paroissiens`}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <Lock className="size-4" aria-hidden />
        </span>
      ) : (
        <button
          type="button"
          onClick={() => {
            const jouables = pistes.filter((p) => !p.verrouille);
            playTracks(jouables, jouables.indexOf(piste));
          }}
          aria-label={`Lire ${piste.title}`}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform hover:bg-primary/15 active:scale-[0.97] motion-reduce:transform-none"
        >
          {enCours ? (
            <Equalizer playing={isPlaying} className="text-primary" />
          ) : (
            <Play className="size-4 fill-current" aria-hidden />
          )}
        </button>
      )}
    </div>
  );
}
