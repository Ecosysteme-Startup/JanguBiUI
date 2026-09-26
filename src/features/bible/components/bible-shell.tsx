import type { ReactNode } from 'react';

import { ParoleNav } from '@/features/bible/components/parole-nav';

/** Édition servie en V1 (ADR-008) ; l'API de la Bible ne l'expose pas. */
export const BIBLE_EDITION = 'Bible Crampon (1923)';

/** Gabarit de FID-Bible : en-tête, sous-navigation de la Parole, panneau des livres et lecture. */
export const BibleShell = ({ panel, children }: { panel: ReactNode; children: ReactNode }) => (
  <div className="min-w-0">
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="m-0 text-32 font-semibold text-ink">Bible</h1>
        <p className="m-0 mt-2 text-16 text-ink-2">{BIBLE_EDITION}, domaine public.</p>
      </div>
      <ParoleNav current="bible" />
    </header>
    <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
      <div className="order-2 min-w-0 lg:order-none">{panel}</div>
      <div className="order-1 min-w-0 lg:order-none">{children}</div>
    </div>
  </div>
);
