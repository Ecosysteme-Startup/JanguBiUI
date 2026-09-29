'use client';

import * as React from 'react';

/** Largeur d'un conteneur (ResizeObserver), avec valeur par défaut hors navigateur. */
export const useLargeur = <T extends HTMLElement>(defaut = 560) => {
  const ref = React.useRef<T>(null);
  const [largeur, setLargeur] = React.useState(defaut);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.clientWidth) setLargeur(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const obs = new ResizeObserver(([e]) => {
      if (e?.contentRect.width) setLargeur(e.contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, largeur] as const;
};
