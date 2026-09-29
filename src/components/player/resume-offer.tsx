'use client';

import { motion } from 'motion/react';
import { useRef } from 'react';

import { easings, playerMotion } from '@/lib/motion/tokens';
import { useMotionOK } from '@/lib/motion/use-motion-ok';
import { getDeviceId } from '@/lib/player/device';
import { deviceLabel, formatClock, formatHour } from '@/lib/player/format';
import { usePlayerStore } from '@/lib/player/player-store';
import { cn } from '@/utils/cn';

import { PlayerCover } from './player-cover';

/**
 * « Reprendre sur cet appareil » (spec L05, décision 6) : au démarrage si le
 * serveur a un état de lecture, ou quand un autre appareil écrit
 * (`playback.state`) alors qu'on n'écoute rien ici. Carte non modale, au-dessus
 * de la barre. La reprise ici ne met pas l'autre appareil en pause.
 */
export function ResumeOffer({ className }: { className?: string }) {
  const ok = useMotionOK();
  const live = usePlayerStore((s) => s.offer);
  // Garde la dernière offre pendant le fondu de sortie.
  const last = useRef(live);
  if (live) last.current = live;
  const offer = live ?? last.current;
  const accept = usePlayerStore((s) => s.acceptOffer);
  const dismiss = usePlayerStore((s) => s.setOffer);
  if (!offer) return null;

  const elsewhere = offer.deviceId !== getDeviceId();
  const hour = formatHour(offer.updatedAt);
  const at = formatClock(offer.positionSeconds);
  const duration = offer.track.duration_seconds;
  const ratio =
    duration > 0 ? Math.min(1, offer.positionSeconds / duration) : 0;

  return (
    <motion.section
      role="region"
      aria-labelledby="jb-resume-title"
      aria-live="polite"
      className={cn(
        'w-full rounded-16 border border-line bg-surface p-4 text-ink shadow-menu md:w-[380px]',
        className,
      )}
      initial={ok ? { opacity: 0, y: 8 } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: ok ? playerMotion.controlsDuration : playerMotion.reduced,
        ease: easings.outCubic,
      }}
    >
      <h2 id="jb-resume-title" className="font-sans text-15 font-semibold">
        Reprendre sur cet appareil ?
      </h2>
      <p className="mt-0.5 text-14 text-ink-3">
        {elsewhere
          ? `Vous écoutiez sur ${deviceLabel(offer.deviceId)}${hour ? ` à ${hour}` : ''}.`
          : `Vous écoutiez${hour ? ` à ${hour}` : ''}.`}
      </p>
      <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface-2 p-2.5">
        <PlayerCover
          track={offer.track}
          className="size-12 shrink-0 rounded-lg"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-14 font-semibold">{offer.track.title}</p>
          <p className="truncate text-13 text-ink-3">
            {offer.track.source?.name ?? offer.track.performers[0] ?? ''}
          </p>
          <span
            aria-hidden
            className="mt-1.5 block h-1 overflow-hidden rounded-full bg-line"
          >
            <span
              className="block h-full origin-left rounded-full bg-primary-fill"
              style={{ transform: `scaleX(${ratio})` }}
            />
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => dismiss(null)}
          className="h-10 rounded-xl px-3.5 text-14 font-semibold text-ink-3 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Pas maintenant
        </button>
        <button
          type="button"
          onClick={() => void accept()}
          className="h-10 rounded-xl bg-primary-fill px-4 text-14 font-semibold text-on-primary hover:bg-primary-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Reprendre ici à {at}
        </button>
      </div>
    </motion.section>
  );
}
