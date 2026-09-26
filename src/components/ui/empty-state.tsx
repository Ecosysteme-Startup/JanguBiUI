import { cn } from '@/utils/cn';

import { Icon, type IconName } from './icon';

/**
 * État vide ou d'erreur (WEB-Design-System, « Chargement, progression, vide ») : pastille 48
 * (fond surface, bordure line, icône ink3), titre 16/600, phrase 14 ink2, une action au plus.
 * `align="start"` pour un encart dans une colonne de texte.
 */
export const EmptyState = ({
  icon = 'boite',
  title,
  children,
  action,
  tone = 'neutral',
  align = 'center',
  className,
}: {
  icon?: IconName;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  tone?: 'neutral' | 'err';
  align?: 'center' | 'start';
  className?: string;
}) => (
  <div
    role={tone === 'err' ? 'alert' : undefined}
    className={cn(
      'flex flex-col px-6 py-8',
      align === 'center' ? 'items-center text-center' : 'items-start text-left',
      className,
    )}
  >
    <span
      className={cn(
        'inline-flex size-12 items-center justify-center rounded-full border border-line bg-surface',
        tone === 'err' ? 'text-err' : 'text-ink-3',
      )}
    >
      <Icon name={icon} size={22} />
    </span>
    <p className="m-0 mt-3 text-16 font-semibold text-ink">{title}</p>
    {children && <div className="mt-1 max-w-reading text-14 text-ink-2">{children}</div>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);
