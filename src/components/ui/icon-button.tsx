import * as React from 'react';

import { cn } from '@/utils/cn';

import { Icon, type IconName } from './icon';

type IconButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: IconName;
  /** Obligatoire : un bouton icône a toujours un nom accessible. */
  label: string;
  /** Contour (bordure line, rayon 12), sinon nu (rayon 10, survol surface2). */
  bordered?: boolean;
  size?: 'md' | 'sm';
  /** Pastille « non lu » en haut à droite (cloche des notifications). */
  dot?: boolean;
};

/** Bouton icône (WEB-Design-System, « Icône seule ») : 40 px (32 en sm), cible 44 px. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, bordered = false, size = 'md', dot = false, className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(iconButtonClasses({ bordered, size }), className)}
      {...props}
    >
      <Icon name={icon} size={size === 'md' ? 20 : 18} />
      {dot && <UnreadDot />}
    </button>
  ),
);
IconButton.displayName = 'IconButton';

/** Classes du bouton icône, réutilisables sur un lien (`<NextLink className={iconButtonClasses()}>`). */
export const iconButtonClasses = ({ bordered = false, size = 'md' }: { bordered?: boolean; size?: 'md' | 'sm' } = {}) =>
  cn(
    'hit inline-flex shrink-0 items-center justify-center text-ink transition-colors disabled:cursor-not-allowed disabled:text-ink-4',
    size === 'md' ? 'size-10' : 'size-8',
    bordered ? 'rounded-12 border border-line bg-paper hover:border-line-field hover:bg-surface' : 'rounded-10 hover:bg-surface-2',
  );

/** Pastille 8 px (12 avec le liseré) cerclée du fond de page, posée sur une icône (notifications non lues). */
export const UnreadDot = ({ className }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={cn('absolute right-[9px] top-2 size-3 rounded-full border-2 border-paper bg-primary-fill', className)}
  />
);
