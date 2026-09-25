'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import NextLink from 'next/link';
import * as React from 'react';

import { cn } from '@/utils/cn';

/** Onglets soulignés (DS-Composants §05) : 44 px, filet 2 px sous l'onglet actif. */
const tabClass = (active: boolean) =>
  cn(
    '-mb-px inline-flex h-11 items-center gap-2 border-b-2 text-base transition-colors',
    active ? 'border-primary font-semibold text-ink' : 'border-transparent text-ink-2 hover:text-primary',
  );

const Count = ({ value, active }: { value: number; active: boolean }) => (
  <span className={cn('tnum text-meta', active ? 'text-primary' : 'text-ink-3')}>{value}</span>
);

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List className={cn('flex gap-8 overflow-x-auto border-b border-line', className)} {...props} />
);

export const TabsTrigger = ({
  className,
  count,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & { count?: number }) => (
  <TabsPrimitive.Trigger
    className={cn(
      '-mb-px inline-flex h-11 items-center gap-2 border-b-2 border-transparent text-base text-ink-2 transition-colors hover:text-primary data-[state=active]:border-primary data-[state=active]:font-semibold data-[state=active]:text-ink',
      className,
    )}
    {...props}
  >
    {children}
    {count !== undefined && <span className="tnum text-meta text-ink-3">{count}</span>}
  </TabsPrimitive.Trigger>
);

export const TabsContent = TabsPrimitive.Content;

/** Variante navigation : chaque onglet est un lien (URL = état, spec §3). */
export const TabLinks = ({
  items,
  label,
  className,
}: {
  items: { href: string; label: string; active: boolean; count?: number }[];
  label: string;
  className?: string;
}) => (
  <nav aria-label={label} className={cn('flex gap-8 overflow-x-auto border-b border-line', className)}>
    {items.map((item) => (
      <NextLink
        key={item.href}
        href={item.href}
        aria-current={item.active ? 'page' : undefined}
        className={cn(tabClass(item.active), 'hover:no-underline', item.active ? 'text-ink hover:text-ink' : '')}
      >
        {item.label}
        {item.count !== undefined && <Count value={item.count} active={item.active} />}
      </NextLink>
    ))}
  </nav>
);
