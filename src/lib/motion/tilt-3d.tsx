'use client';

import { motion, useSpring } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { tiltSpring } from './tokens';
import { useMotionOK } from './use-motion-ok';

interface Tilt3DProps {
  children: ReactNode;
  className?: string;
  /** Inclinaison maximale (degrés) sur chaque axe. */
  max?: number;
  /**
   * `self` : le pointeur est suivi au-dessus de l'élément seulement ;
   * `window` : partout dans la fenêtre, relativement au centre de l'élément
   * (idéal pour un objet central du hero).
   */
  track?: 'self' | 'window';
  /** Classes de l'élément incliné (mise en page des enfants). */
  innerClassName?: string;
}

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/**
 * Légère inclinaison 3D au pointeur : perspective CSS 1 000 px,
 * rotateX / rotateY ≤ 6°, ressort doux. Désactivée au tactile (pas de
 * survol fin) et en reduced motion — l'objet reste alors à plat.
 */
export function Tilt3D({
  children,
  className,
  max = 6,
  track = 'self',
  innerClassName,
}: Tilt3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const ok = useMotionOK();
  const [finePointer, setFinePointer] = useState(false);
  const rotateX = useSpring(0, tiltSpring);
  const rotateY = useSpring(0, tiltSpring);
  const enabled = ok && finePointer;

  useEffect(() => {
    const mq = window.matchMedia?.('(hover: hover) and (pointer: fine)');
    if (!mq) return;
    const sync = () => setFinePointer(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  const tiltTo = (
    clientX: number,
    clientY: number,
    spanX: number,
    spanY: number,
  ) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = clamp((clientX - (r.left + r.width / 2)) / spanX);
    const ny = clamp((clientY - (r.top + r.height / 2)) / spanY);
    rotateY.set(nx * max);
    rotateX.set(-ny * max);
  };

  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  useEffect(() => {
    if (!enabled) {
      rotateX.jump(0);
      rotateY.jump(0);
      return;
    }
    if (track !== 'window') return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      tiltTo(
        e.clientX,
        e.clientY,
        window.innerWidth / 2,
        window.innerHeight / 2,
      );
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', reset);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', reset);
    };
    // tiltTo / reset ne dépendent que de refs et de motion values stables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, track, max]);

  const selfHandlers =
    enabled && track === 'self'
      ? {
          onPointerMove: (e: React.PointerEvent) => {
            if (e.pointerType !== 'mouse') return;
            const r = e.currentTarget.getBoundingClientRect();
            tiltTo(e.clientX, e.clientY, r.width / 2, r.height / 2);
          },
          onPointerLeave: reset,
        }
      : {};

  return (
    <div
      ref={ref}
      className={className}
      style={{ perspective: 1000 }}
      {...selfHandlers}
    >
      <motion.div
        className={innerClassName}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
