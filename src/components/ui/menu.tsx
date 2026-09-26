'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as React from 'react';

import { cn } from '@/utils/cn';

import { Icon, type IconName } from './icon';

/**
 * Menu d'actions (WEB-Design-System, « DropdownMenu ») : rayon 12, bordure line, ombre menu,
 * rangées 36 px 14 px, icône ink3, action destructive en dernier (errT).
 */
export const Menu = DropdownMenu.Root;
export const MenuTrigger = DropdownMenu.Trigger;

export const MenuContent = ({ className, sideOffset = 6, align = 'start', ...props }: React.ComponentProps<typeof DropdownMenu.Content>) => (
  <DropdownMenu.Portal>
    <DropdownMenu.Content
      sideOffset={sideOffset}
      align={align}
      className={cn('z-50 min-w-[220px] rounded-12 border border-line bg-paper p-1.5 text-ink shadow-menu', className)}
      {...props}
    />
  </DropdownMenu.Portal>
);

export const MenuItem = ({
  icon,
  shortcut,
  tone = 'default',
  className,
  children,
  asChild,
  ...props
}: React.ComponentProps<typeof DropdownMenu.Item> & { icon?: IconName; shortcut?: string; tone?: 'default' | 'danger' }) => {
  const iconNode = icon && <Icon name={icon} size={18} className={tone === 'danger' ? 'text-err' : 'text-ink-3'} />;
  const shortcutNode = shortcut && <span className="text-12 text-ink-3">{shortcut}</span>;
  // asChild (lien) : l'icône et le raccourci sont insérés DANS l'élément enfant (un seul enfant pour Radix Slot).
  const content =
    asChild && React.isValidElement<{ children?: React.ReactNode }>(children) ? (
      React.cloneElement(
        children,
        undefined,
        iconNode,
        <span className="flex-1 whitespace-nowrap">{children.props.children}</span>,
        shortcutNode,
      )
    ) : (
      <>
        {iconNode}
        <span className="flex-1 whitespace-nowrap">{children}</span>
        {shortcutNode}
      </>
    );
  return (
    <DropdownMenu.Item
      asChild={asChild}
      className={cn(
        'flex min-h-9 cursor-pointer select-none items-center gap-2.5 rounded-8 px-2.5 text-14 outline-none data-[disabled]:cursor-not-allowed data-[highlighted]:bg-surface-2 data-[disabled]:text-ink-4',
        tone === 'danger' ? 'text-err hover:text-err' : 'text-ink hover:text-ink',
        className,
      )}
      {...props}
    >
      {content}
    </DropdownMenu.Item>
  );
};

export const MenuSeparator = ({ className }: { className?: string }) => (
  <DropdownMenu.Separator className={cn('-mx-1.5 my-1 h-px bg-line', className)} />
);

export const MenuLabel = ({ className, ...props }: React.ComponentProps<typeof DropdownMenu.Label>) => (
  <DropdownMenu.Label className={cn('px-2.5 pb-1 pt-1.5 text-13 text-ink-3', className)} {...props} />
);
