'use client';

import { useEffect } from 'react';

import { usePlayerStore } from './player-store';

export const SKIP_SECONDS = 15;

/** Cibles où Espace et les flèches gardent leur sens natif. */
function isOwnedByTarget(target: EventTarget | null, key: string): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  const role = target.getAttribute('role') ?? '';
  if (
    [
      'slider',
      'radio',
      'tab',
      'menuitem',
      'menuitemradio',
      'option',
      'listbox',
      'combobox',
      'textbox',
    ].includes(role)
  )
    return true;
  // Espace « clique » les boutons et liens : on le leur laisse.
  if (key === ' ' && (tag === 'BUTTON' || tag === 'A' || role === 'button'))
    return true;
  return false;
}

/**
 * Raccourcis globaux du lecteur (planche APP-H03, séquence web) :
 * Espace = lecture / pause ; ← / → = −15 s / +15 s ; Échap = réduire le
 * lecteur déployé. Actifs dès qu'une piste est chargée, sauf dans un champ de
 * saisie, un curseur ou un menu.
 */
export function usePlayerShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const s = usePlayerStore.getState();
      if (!s.current) return;
      const key = event.key;
      if (key === 'Escape') {
        // Un menu (vitesse, minuterie…) ouvert se ferme d'abord seul.
        if (document.querySelector('[role="menu"]')) return;
        if (s.expanded) {
          event.preventDefault();
          s.collapse();
        }
        return;
      }
      if (key !== ' ' && key !== 'ArrowLeft' && key !== 'ArrowRight') return;
      if (isOwnedByTarget(event.target, key)) return;
      event.preventDefault();
      if (key === ' ') s.toggle();
      else if (key === 'ArrowLeft') s.skipBy(-SKIP_SECONDS);
      else s.skipBy(SKIP_SECONDS);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
