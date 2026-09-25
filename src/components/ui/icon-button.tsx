import * as React from 'react';

import { cn } from '@/utils/cn';

import { Icon, type IconName } from './icon';

type IconButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: IconName;
  /** Obligatoire : un bouton icône a toujours un nom accessible. */
  label: string;
  bordered?: boolean;
  size?: 'md' | 'sm';
};

/** Bouton icône 40 px (36 en dense), bordé ou nu. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, bordered = false, size = 'md', className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded text-ink transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:text-ink-3',
        'hit', size === 'md' ? 'size-10' : 'size-9',
        bordered && 'border border-line',
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={20} />
    </button>
  ),
);
IconButton.displayName = 'IconButton';
