'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Onglet porté par l'ancre de l'URL (`/app/paroisse#horaires`, cf. `paths.app.paroisse.root`) :
 * lien partageable, retour arrière du navigateur respecté. Sans ancre : `fallback`.
 */
export const useHashTab = <T extends string>(tabs: readonly T[], fallback: T) => {
  const [tab, setTab] = useState<T>(fallback);

  useEffect(() => {
    const read = () => {
      const hash = window.location.hash.replace(/^#/, '');
      setTab((tabs as readonly string[]).includes(hash) ? (hash as T) : fallback);
    };
    read();
    window.addEventListener('hashchange', read);
    window.addEventListener('popstate', read);
    return () => {
      window.removeEventListener('hashchange', read);
      window.removeEventListener('popstate', read);
    };
  }, [tabs, fallback]);

  const select = useCallback(
    (next: T) => {
      setTab(next);
      const url = `${window.location.pathname}${window.location.search}${next === fallback ? '' : `#${next}`}`;
      window.history.pushState(window.history.state, '', url);
    },
    [fallback],
  );

  return [tab, select] as const;
};
