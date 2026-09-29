'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';

import { useMotionOK } from '@/lib/motion/use-motion-ok';

/**
 * Champ d'étoiles du hero (thème sombre). Parallaxe très légère au
 * défilement : les étoiles descendent à 12 % de la vitesse du contenu, ce qui
 * les fait paraître plus lointaines. `transform` seul ; figé en reduced motion.
 */
export function StarField() {
  const ref = useRef<HTMLDivElement>(null);
  const ok = useMotionOK();
  const { scrollY } = useScroll();
  // Toujours lié (pas d'écart d'hydratation) ; vaut 0 en reduced motion.
  const y = useTransform(scrollY, (v) => (ok ? Math.min(v * 0.12, 120) : 0));

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    for (let i = 0; i < 80; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      const sz = Math.random() * 2 + 0.5;
      s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-duration:${2 + Math.random() * 4}s;animation-delay:${Math.random() * 4}s;`;
      container.appendChild(s);
    }
    return () => {
      container.innerHTML = '';
    };
  }, []);

  // Motif nocturne : visible uniquement en thème sombre. En clair le héros
  // s'appuie sur le dégradé papier + le halo bleu (pas d'étoiles sur fond clair).
  return (
    <motion.div
      aria-hidden
      style={{ y }}
      className="pointer-events-none absolute inset-0 hidden dark:block"
    >
      <div ref={ref} className="absolute inset-0" />
    </motion.div>
  );
}
