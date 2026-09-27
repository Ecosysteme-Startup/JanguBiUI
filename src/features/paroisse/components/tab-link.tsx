'use client';

import type { ReactNode } from 'react';

import { paths } from '@/config/paths';

export type ParishTab = 'apercu' | 'horaires' | 'annonces' | 'agenda';

/** Lien « Tous les horaires », « Agenda complet » : ouvre l'onglet (l'ancre reste un vrai lien). */
export const TabLink = ({ tab, onSelect, children }: { tab: Exclude<ParishTab, 'apercu'>; onSelect: (tab: ParishTab) => void; children: ReactNode }) => (
  <a
    href={paths.app.paroisse.root.getHref(tab)}
    onClick={(event) => {
      event.preventDefault();
      onSelect(tab);
      document.getElementById('mp-onglets')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }}
    className="text-15 font-medium text-primary hover:text-primary-strong"
  >
    {children}
  </a>
);
