'use client';

import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useEffect, useRef } from 'react';

import { useMe } from '@/hooks/use-me';
import { easings, playerMotion } from '@/lib/motion/tokens';
import { useMotionOK } from '@/lib/motion/use-motion-ok';
import { type AudioEngine, HtmlAudioEngine } from '@/lib/player/engine';
import { attachPlayerEngine, usePlayerStore } from '@/lib/player/player-store';
import { useMediaSession } from '@/lib/player/use-media-session';
import { usePlayerShortcuts } from '@/lib/player/use-player-shortcuts';
import { usePlayerSync } from '@/lib/player/use-player-sync';

import { PlayerBar } from './player-bar';
import { PlayerPanel } from './player-panel';
import { ResumeOffer } from './resume-offer';

interface PlayerRootProps {
  /** Tests : moteur simulé à la place de `<audio>` + hls.js. */
  createEngine?: (audio: HTMLAudioElement) => AudioEngine;
}

/**
 * Lecteur audio global, monté UNE fois dans le shell de `/app` : il survit à
 * la navigation entre les pages. Contient l'unique `<audio>`, la barre de
 * lecture persistante, le lecteur déployé en panneau latéral droit
 * (décision 13 : la page reste visible et utilisable), l'offre de reprise, les
 * raccourcis clavier et la synchronisation avec le serveur.
 */
export function PlayerRoot({ createEngine }: PlayerRootProps) {
  const ok = useMotionOK();
  const audioRef = useRef<HTMLAudioElement>(null);
  const { data: me } = useMe();
  const current = usePlayerStore((s) => s.current);
  const expanded = usePlayerStore((s) => s.expanded);
  const hasOffer = usePlayerStore((s) => s.offer != null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const engine = createEngine
      ? createEngine(audio)
      : new HtmlAudioEngine(audio);
    const detach = attachPlayerEngine(engine);
    return () => {
      detach();
      engine.destroy();
    };
  }, [createEngine]);

  // Une lecture à la fois (décision 10) : `usePlayerSync` écoute sur le bus les trames
  // `playback.state` de la socket `ws/notifications/` unique de l'onglet (`RealtimeBridge`,
  // monté par le shell) et met ce lecteur en pause quand un autre appareil lance la lecture.
  usePlayerSync(!!me);
  usePlayerShortcuts();
  useMediaSession();

  return (
    <LayoutGroup id="jb-player">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        preload="auto"
        className="hidden"
        data-testid="jb-player-audio"
      />

      <div className="pointer-events-none fixed inset-x-0 bottom-14 z-40 flex flex-col print:hidden lg:bottom-0 lg:left-66">
        <div className="flex justify-end px-4 pb-3 md:px-6">
          <AnimatePresence>
            {hasOffer && (
              <ResumeOffer key="offer" className="pointer-events-auto" />
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence initial={false}>
          {current && (
            <motion.div
              key="bar"
              className="pointer-events-auto"
              initial={ok ? { opacity: 0, y: 8 } : { opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: ok
                  ? playerMotion.controlsDuration
                  : playerMotion.reduced,
                ease: easings.outCubic,
              }}
            >
              <PlayerBar />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Décision 13 : panneau latéral droit, non modal. */}
      <AnimatePresence>
        {expanded && current && <PlayerPanel key="panel" />}
      </AnimatePresence>
    </LayoutGroup>
  );
}

/** Réserve la hauteur de la barre en bas du contenu quand une piste est chargée. */
export function PlayerSpacer() {
  const active = usePlayerStore((s) => s.current != null);
  if (!active) return null;
  return <div aria-hidden className="h-16 shrink-0 md:h-[88px]" />;
}
