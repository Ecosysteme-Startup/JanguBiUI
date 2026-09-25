import { cn } from '@/utils/cn';

import { Icon, type IconName } from './icon';

const TONES = {
  info: { box: 'border-primary bg-tint-50', title: 'text-primary-strong', icon: 'info' },
  warn: { box: 'border-warn-dot bg-warn-bg', title: 'text-warn', icon: 'alerte' },
  err: { box: 'border-err bg-err-bg', title: 'text-err', icon: 'alerte' },
  ok: { box: 'border-ok bg-ok-bg', title: 'text-ok', icon: 'check' },
} as const;

/** Encart (DS-Composants §12) : filet coloré tout autour, jamais une bordure gauche seule. */
export const Notice = ({
  tone = 'info',
  title,
  children,
  icon,
  className,
}: {
  tone?: keyof typeof TONES;
  title: React.ReactNode;
  children?: React.ReactNode;
  icon?: IconName;
  className?: string;
}) => (
  <div role="note" className={cn('flex gap-3 rounded border px-4 py-3', TONES[tone].box, className)}>
    <Icon name={icon ?? TONES[tone].icon} size={20} className={cn('mt-0.5 shrink-0', TONES[tone].title)} />
    <div className="min-w-0">
      <p className={cn('m-0 text-base font-semibold', TONES[tone].title)}>{title}</p>
      {children && <div className="mt-0.5 text-sm leading-normal text-ink">{children}</div>}
    </div>
  </div>
);
