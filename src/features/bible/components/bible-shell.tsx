import type { ReactNode } from 'react';

import { env } from '@/config/env';
import { ParoleNav } from '@/features/bible/components/parole-nav';

/**
 * Édition de la Bible réellement servie (ADR-008), issue de la configuration ; l'API de la Bible
 * ne l'expose pas. Vide quand aucune édition n'est annoncée (en recette, texte AELF seul) : on
 * n'affiche alors aucune mention plutôt que de revendiquer à tort « Crampon ».
 */
export const BIBLE_EDITION = env.BIBLE_EDITION ?? '';

/** Gabarit de FID-Bible : en-tête, sous-navigation de la Parole, panneau des livres et lecture. */
export const BibleShell = ({ panel, children }: { panel: ReactNode; children: ReactNode }) => (
  <div className="min-w-0 overflow-x-clip [overflow-clip-margin:16px]">
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="m-0 text-32 font-semibold text-ink">Bible</h1>
        {BIBLE_EDITION ? <p className="m-0 mt-2 text-16 text-ink-2">{BIBLE_EDITION}, domaine public.</p> : null}
      </div>
      <ParoleNav current="bible" />
    </header>
    <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
      <div className="order-2 min-w-0 lg:order-none">{panel}</div>
      <div className="order-1 min-w-0 lg:order-none">{children}</div>
    </div>
  </div>
);
