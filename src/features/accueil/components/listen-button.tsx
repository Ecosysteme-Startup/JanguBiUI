'use client';

import { useRef, useState } from 'react';

import { Icon } from '@/components/ui/icon';

/**
 * « Écouter » de la carte « La Parole du jour » (FID-Accueil) : lit l'audio des lectures du jour sur
 * place (lecture / pause). La durée de la maquette (« · 7 min ») n'est pas fournie par l'API.
 */
export const ListenButton = ({ src }: { src: string }) => {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => setPlaying(false));
    else el.pause();
  };
  return (
    <>
      <button
        type="button"
        aria-pressed={playing}
        onClick={toggle}
        className="inline-flex min-h-12 items-center gap-2 rounded-12 bg-primary-fill-hover px-[18px] text-16 font-semibold text-lit-white transition-colors hover:bg-night-2"
      >
        <Icon name={playing ? 'pause' : 'ecouter'} size={20} />
        {playing ? 'Pause' : 'Écouter'}
        <span className="sr-only"> les lectures du jour</span>
      </button>
      {/* Pas de sous-titres fournis par l'API : le texte des lectures est sur la page de la Parole. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audio}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
    </>
  );
};
