import { cn } from '@/utils/cn';

import { Icon, type IconName } from './icon';

/** État vide ou d'erreur : sobre, filet, jamais d'emoji. */
export const EmptyState = ({
  icon = 'info',
  title,
  children,
  action,
  tone = 'neutral',
  className,
}: {
  icon?: IconName;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  tone?: 'neutral' | 'err';
  className?: string;
}) => (
  <div
    role={tone === 'err' ? 'alert' : undefined}
    className={cn('flex flex-col items-start gap-3 border border-line bg-surface px-6 py-8', className)}
  >
    <Icon name={icon} size={24} className={tone === 'err' ? 'text-err' : 'text-ink-3'} />
    <p className="m-0 font-serif text-h4 text-ink">{title}</p>
    {children && <div className="max-w-reading text-base text-ink-2">{children}</div>}
    {action}
  </div>
);
