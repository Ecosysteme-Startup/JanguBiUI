'use client';

import * as React from 'react';

import { cn } from '@/utils/cn';

type ScrollRegionProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Nom de la zone annoncé quand elle défile (ex. « Tableau des offices, défilement horizontal »). */
  label: string;
};

/**
 * Conteneur à défilement horizontal accessible (WCAG 2.1.1, axe `scrollable-region-focusable`,
 * recette A11Y-12) : dès que le contenu dépasse, la zone devient une région nommée et
 * focalisable, que l'on fait défiler au clavier avec les flèches. Tant que tout tient, elle
 * reste un simple bloc, sans arrêt de tabulation inutile.
 */
export const ScrollRegion = ({ label, className, children, ...props }: ScrollRegionProps) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Les deux axes : overflow-x:auto rend aussi l'axe vertical défilant (une zone .hit de 44 px
    // en dernière ligne suffit à le déclencher, cf. axe sur le tableau de bord diocésain à 1024 px).
    const measure = () => setScrollable(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      role={scrollable ? 'region' : undefined}
      aria-label={scrollable ? label : undefined}
      tabIndex={scrollable ? 0 : undefined}
      // relative : un descendant en position absolue (texte `sr-only` d'un en-tête de colonne) a
      // sinon pour bloc conteneur la page entière, échappe au défilement et élargit la page (A11Y-08).
      className={cn('relative w-full overflow-x-auto', className)}
      {...props}
    >
      {children}
    </div>
  );
};
