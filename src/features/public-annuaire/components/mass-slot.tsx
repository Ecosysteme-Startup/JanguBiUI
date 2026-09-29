import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

import type { Occurrence } from '../api/get-node-week';

/** Titre d'un créneau : « Messe », « Messe des étudiants », « Confessions ». */
export const slotTitle = (o: Occurrence) => {
  if (o.kind === 'messe') return o.note ? `Messe ${o.note.replace(/^messe\s+/i, '')}` : 'Messe';
  const kind = o.kind === 'confession' ? 'Confessions' : o.kind.charAt(0).toUpperCase() + o.kind.slice(1);
  return o.note ? `${kind}, ${o.note}` : kind;
};

type MassSlotProps = {
  occurrence: Occurrence;
  /** Mention sous l'heure (« ce soir », « dim. 27 », « 45 min »). */
  when: string;
  /** `next` : créneau mis en avant (fond b50) ; `past` : passé, en gris. */
  tone?: 'default' | 'next' | 'past';
  size?: 'sm' | 'md';
  /** Élément à droite (« Passée », « Prochaine »). */
  aside?: ReactNode;
  className?: string;
};

/**
 * Créneau d'horaire (WEB-Accueil, WEB-Fiche-Paroisse) : heure et mention, filet vertical,
 * intitulé et lieu. `sm` : carte 12/14 (aperçus) ; `md` : rangée 16/20 (fiche).
 */
export const MassSlot = ({ occurrence, when, tone = 'default', size = 'sm', aside, className }: MassSlotProps) => (
  <div
    className={cn(
      'flex items-center border',
      size === 'sm' ? 'gap-3.5 rounded-12 px-3.5 py-3' : 'gap-5 rounded-16 px-5 py-4',
      tone === 'next' ? 'border-line-active bg-tint-50' : 'border-line',
      tone === 'past' && 'text-ink-3',
      className,
    )}
  >
    <div className={cn('tnum shrink-0', size === 'sm' ? 'w-13' : 'w-16')}>
      <div className={cn('font-semibold', size === 'sm' ? 'text-15' : 'text-17')}>{occurrence.start_time.slice(0, 5)}</div>
      <div className={cn(size === 'sm' ? 'text-12' : 'text-13', tone === 'past' ? 'text-ink-3' : 'text-ink-2')}>{when}</div>
    </div>
    <div aria-hidden="true" className={cn('w-px self-stretch', tone === 'next' ? 'bg-line-active' : 'bg-line')} />
    <div className="min-w-0 flex-1">
      <div className={cn('font-semibold', size === 'sm' ? 'text-15' : 'text-16')}>{slotTitle(occurrence)}</div>
      <div className={cn(size === 'sm' ? 'text-13' : 'text-14', tone === 'past' ? 'text-ink-3' : 'text-ink-2')}>{occurrence.place_name}</div>
    </div>
    {aside}
  </div>
);
