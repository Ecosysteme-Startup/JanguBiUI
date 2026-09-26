import type * as React from 'react';

import { cn } from '@/utils/cn';

import { Icon, type IconName } from './icon';

/**
 * Badges (WEB-Design-System, « Badges de statut ») : pilule 24 px, 12/600, point de 6 px.
 * Toujours un libellé : la couleur seule ne porte jamais le sens.
 */
export const BADGE_TONES = {
  neutral: { box: 'bg-surface-2 text-ink-2', dot: 'bg-ink-3' },
  info: { box: 'bg-tint-50 text-tint-800', dot: 'bg-primary-fill' },
  warn: { box: 'bg-warn-bg text-warn', dot: 'bg-warn-dot' },
  ok: { box: 'bg-ok-bg text-ok', dot: 'bg-ok-dot' },
  err: { box: 'bg-err-bg text-err', dot: 'bg-err-fill' },
  muted: { box: 'bg-surface-2 text-ink-3', dot: 'bg-ink-3' },
} as const;
export type BadgeTone = keyof typeof BADGE_TONES;

type BadgeProps = {
  tone?: BadgeTone;
  /** Point de couleur avant le libellé (statuts). */
  dot?: boolean;
  /** Icône 12 px avant le libellé (« Retirée » : coche ; « Interne » : cadenas). */
  icon?: IconName;
  children: React.ReactNode;
  className?: string;
};

export const Badge = ({ tone = 'neutral', dot = false, icon, children, className }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-12 font-semibold',
      icon && 'gap-1',
      BADGE_TONES[tone].box,
      className,
    )}
  >
    {dot && <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', BADGE_TONES[tone].dot)} />}
    {icon && <Icon name={icon} size={12} strokeWidth={2.25} className="shrink-0" />}
    {children}
  </span>
);

/** Étiquette de catégorie d'annonce : surface2 / ink2, sans point. */
export const Tag = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <Badge tone="neutral" className={className}>
    {children}
  </Badge>
);

/**
 * Compteur 22 px : `neutral` (b100 / b800, à traiter) ou `unread` (aplat b600, non lu).
 * Le nombre seul est ambigu : passer `label` (« 3 messages non lus ») pour le lecteur d'écran.
 */
export const CountBadge = ({
  value,
  tone = 'neutral',
  label,
  className,
}: {
  value: number;
  tone?: 'neutral' | 'unread';
  label?: string;
  className?: string;
}) => (
  <span
    className={cn(
      'tnum inline-flex h-[22px] min-w-[22px] shrink-0 items-center justify-center rounded-full px-1.5 text-12 font-semibold',
      tone === 'unread' ? 'bg-primary-fill text-on-primary' : 'bg-tint-100 text-tint-800',
      className,
    )}
  >
    <span aria-hidden={label ? true : undefined}>{value}</span>
    {label && <span className="sr-only">{label}</span>}
  </span>
);

/** Délai en retard : texte warnT 14/600 avec icône triangle, jamais une ligne colorée. */
export const DelayBadge = ({ days, late = false, className }: { days: number; late?: boolean; className?: string }) => (
  <span className={cn('tnum inline-flex items-center gap-1.5 text-14', late ? 'font-semibold text-warn' : 'text-ink-2', className)}>
    {late && <Icon name="alerte" size={14} label="En retard" />}
    {days}&nbsp;j
  </span>
);

/** Couleurs liturgiques : pastilles uniquement, jamais en aplat. */
export const LITURGICAL_DOT = {
  vert: { label: 'Vert', dot: 'bg-lit-green' },
  rouge: { label: 'Rouge', dot: 'bg-lit-red' },
  violet: { label: 'Violet', dot: 'bg-lit-violet' },
  blanc: { label: 'Blanc', dot: 'lit-dot-white' },
  rose: { label: 'Rose', dot: 'bg-lit-rose' },
} as const;
export type LiturgicalDotColor = keyof typeof LITURGICAL_DOT;

/** Point liturgique seul (bande de dates, calendrier) : 6 px par défaut. */
export const LiturgicalDot = ({ color, size = 6, className }: { color: string; size?: 6 | 8 | 10; className?: string }) => {
  const c = LITURGICAL_DOT[color as LiturgicalDotColor] ?? LITURGICAL_DOT.vert;
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block shrink-0 rounded-full', { 6: 'size-1.5', 8: 'size-2', 10: 'size-2.5' }[size], c.dot, className)}
    />
  );
};

/** Pastille liturgique (« Vert ») : 26 px, fond paper, bordure line, point de 10 px, 13/500. */
export const LiturgicalPill = ({ color, title, className }: { color: string; title?: string; className?: string }) => {
  const c = LITURGICAL_DOT[color as LiturgicalDotColor] ?? LITURGICAL_DOT.vert;
  return (
    <span
      title={title ?? `Couleur liturgique : ${c.label.toLowerCase()}`}
      className={cn(
        'inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-paper pl-2 pr-2.5 text-13 font-medium text-ink',
        className,
      )}
    >
      <LiturgicalDot color={color} size={10} />
      {c.label}
    </span>
  );
};
