'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { create } from 'zustand';

/**
 * Emplacements des coquilles que les pages remplissent (état d'interface, Zustand autorisé) :
 * - barre supérieure 64 px : `start` (fil d'Ariane ou texte, à gauche) et `end` (action avant la cloche) ;
 * - mise en page du <main> : `fullBleed` (ni padding ni largeur max, hauteur de la fenêtre) et
 *   `hideTopbar` (messagerie plein cadre, FID-Conversation).
 */
type ShellSlots = {
  startEl: HTMLElement | null;
  endEl: HTMLElement | null;
  startCount: number;
  endCount: number;
  fullBleed: number;
  hideTopbar: number;
  set: (patch: Partial<Omit<ShellSlots, 'set'>>) => void;
  bump: (key: 'startCount' | 'endCount' | 'fullBleed' | 'hideTopbar', delta: 1 | -1) => void;
};

export const useShellSlots = create<ShellSlots>((set) => ({
  startEl: null,
  endEl: null,
  startCount: 0,
  endCount: 0,
  fullBleed: 0,
  hideTopbar: 0,
  set: (patch) => set(patch),
  bump: (key, delta) => set((s) => ({ [key]: Math.max(0, s[key] + delta) }) as Partial<ShellSlots>),
}));

const useSlotRegistration = (key: 'startCount' | 'endCount' | 'fullBleed' | 'hideTopbar', active: boolean) => {
  const bump = useShellSlots((s) => s.bump);
  React.useEffect(() => {
    if (!active) return;
    bump(key, 1);
    return () => bump(key, -1);
  }, [active, bump, key]);
};

/**
 * Contenu de la barre supérieure fourni par la page :
 * `<TopbarContent start={<Breadcrumbs items={…} />} end={<NextLink …>Mes rendez-vous</NextLink>} />`.
 * Sans `start`, la coquille affiche son texte par défaut (date du jour, ou « Nœud · Parent »).
 */
export const TopbarContent = ({ start, end }: { start?: React.ReactNode; end?: React.ReactNode }) => {
  const startEl = useShellSlots((s) => s.startEl);
  const endEl = useShellSlots((s) => s.endEl);
  useSlotRegistration('startCount', start !== undefined);
  useSlotRegistration('endCount', end !== undefined);
  return (
    <>
      {start !== undefined && startEl && createPortal(start, startEl)}
      {end !== undefined && endEl && createPortal(end, endEl)}
    </>
  );
};

/**
 * Mise en page de la page dans la coquille : `fullBleed` retire padding et largeur max du <main>
 * et lui donne la hauteur restante de la fenêtre (colonnes à défilement propre : messageries) ;
 * `hideTopbar` masque la barre supérieure (FID-Conversation).
 */
export const ShellLayout = ({ fullBleed = false, hideTopbar = false }: { fullBleed?: boolean; hideTopbar?: boolean }) => {
  useSlotRegistration('fullBleed', fullBleed);
  useSlotRegistration('hideTopbar', hideTopbar);
  return null;
};

/** Cibles des portails, posées par la coquille dans sa barre supérieure. */
export const TopbarSlotTargets = ({ fallback }: { fallback: React.ReactNode }) => {
  const set = useShellSlots((s) => s.set);
  const startCount = useShellSlots((s) => s.startCount);
  const ref = React.useCallback((el: HTMLDivElement | null) => set({ startEl: el }), [set]);
  return (
    <>
      <div ref={ref} className="flex min-w-0 items-center" />
      {startCount === 0 && fallback}
    </>
  );
};

export const TopbarEndTarget = () => {
  const set = useShellSlots((s) => s.set);
  const ref = React.useCallback((el: HTMLDivElement | null) => set({ endEl: el }), [set]);
  return <div ref={ref} className="flex items-center gap-4 empty:hidden" />;
};
