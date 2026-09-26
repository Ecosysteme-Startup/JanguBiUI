import { cn } from '@/utils/cn';

import { Icon, type IconName } from './icon';

const TONES = {
  info: { box: 'bg-tint-50 text-tint-900', icon: 'info' },
  ok: { box: 'bg-ok-bg text-ok', icon: 'succes' },
  warn: { box: 'bg-warn-bg text-warn', icon: 'alerte' },
  err: { box: 'bg-err-bg text-err', icon: 'erreur' },
} as const;
export type NoticeTone = keyof typeof TONES;

/**
 * Alerte (WEB-Design-System, « Alertes ») : aplat teinté rayon 12, icône 18 et texte 14/20 dans
 * la couleur du statut, sans bordure. Info b50/b900, succès, attention, erreur.
 * `role="note"` par défaut ; passer `role="alert"` pour une erreur survenue après une action.
 */
export const Notice = ({
  tone = 'info',
  title,
  children,
  icon,
  role = 'note',
  action,
  className,
}: {
  tone?: NoticeTone;
  title: React.ReactNode;
  children?: React.ReactNode;
  icon?: IconName;
  role?: 'note' | 'status' | 'alert';
  /** Lien ou bouton discret aligné à droite (« Réessayer »). */
  action?: React.ReactNode;
  className?: string;
}) => (
  <div role={role} className={cn('flex gap-2.5 rounded-12 px-3.5 py-3 text-14', TONES[tone].box, className)}>
    <Icon name={icon ?? TONES[tone].icon} size={18} className="mt-px shrink-0" />
    <div className="min-w-0 flex-1">
      <p className={cn('m-0', children && 'font-semibold')}>{title}</p>
      {children && <div className="mt-0.5">{children}</div>}
    </div>
    {action && <div className="shrink-0 font-semibold">{action}</div>}
  </div>
);
