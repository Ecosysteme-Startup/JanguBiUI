'use client';

import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { durations, easings } from './tokens';
import { useInViewOnce } from './use-in-view-once';
import { useMotionOK } from './use-motion-ok';

const useIsoLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface CountUpProps {
  to: number;
  /** Mise en forme de la valeur courante (la valeur finale vaut exactement `to`). */
  format?: (value: number) => string;
  duration?: number;
  className?: string;
}

/**
 * Compteur 0 → `to` (out-cubic) déclenché à l'entrée dans l'écran.
 * Le HTML serveur contient la valeur FINALE ; on ne repart de 0 que si le
 * compteur est sous la ligne de flottaison au montage (donc invisible).
 * Reduced motion : valeur finale immédiate.
 */
export function CountUp({
  to,
  format = (v) => String(Math.round(v)),
  duration = durations.countUp,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const ok = useMotionOK();
  const value = useMotionValue(to);
  const text = useTransform(value, format);
  const inView = useInViewOnce(ref, { amount: 0.5 });
  const [armed, setArmed] = useState(false);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!ok || !el || typeof IntersectionObserver === 'undefined') return;
    if (el.getBoundingClientRect().top > window.innerHeight) {
      value.jump(0);
      setArmed(true);
    }
    // Armement unique au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!armed || !inView) return;
    if (!ok) {
      value.jump(to);
      return;
    }
    const controls = animate(value, to, { duration, ease: easings.outCubic });
    return () => controls.stop();
  }, [armed, inView, ok, to, duration, value]);

  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  );
}
