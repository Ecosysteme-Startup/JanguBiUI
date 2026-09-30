'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'motion/react';
import NextLink from 'next/link';
import * as React from 'react';

import { springs } from '@/lib/motion/tokens';
import { cn } from '@/utils/cn';

/**
 * Onglets soulignés (WEB-Design-System « Onglets », WEB-FID-Parole) : 44 px, soulignement b600
 * de 2 px sous l'onglet actif (libellé 600 en encre), inactifs en 500, compteur 13 tabulaire.
 * `md` : 15 px, écart 24 (listes du back-office). `lg` : 16 px, écart 32 (lecture de la Parole).
 */
type TabSize = 'md' | 'lg';

const listClass = (size: TabSize) => cn('flex overflow-x-auto border-b border-line', size === 'lg' ? 'gap-8' : 'gap-6 px-1');

const triggerBase = (size: TabSize) =>
  cn(
    '-mb-px inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent font-medium transition-colors hover:text-ink',
    size === 'lg' ? 'text-16 text-ink-3' : 'text-15 text-ink-2',
  );

const activeClass = 'border-primary font-semibold text-ink';

/** Compteur d'onglet : texte 13 (défaut) ou pilule 20 px 12/600 (`pill`, DIO-Nominations, PLA-Comptes). */
const Count = ({ value, active, pill }: { value: number; active: boolean; pill?: boolean }) =>
  pill ? (
    <span
      className={cn(
        'tnum inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-12 font-semibold',
        active ? 'bg-tint-100 text-tint-800' : 'bg-surface-2 text-ink-2',
      )}
    >
      {value}
    </span>
  ) : (
    <span className={cn('tnum text-13 font-normal', active ? 'text-primary-strong' : 'text-ink-3')}>{value}</span>
  );

const TabsSizeContext = React.createContext<TabSize>('md');

/** Onglet courant et identifiant du groupe, pour faire glisser le soulignement d'un onglet à l'autre. */
const TabsValueContext = React.createContext<{ value?: string; id: string } | null>(null);

/**
 * Racine des onglets : suit l'onglet courant (contrôlé ou non) pour que le soulignement b600
 * glisse vers le nouvel onglet avec le ressort de la barre d'onglets mobile (`springs.indicator`).
 */
export const Tabs = ({ value, defaultValue, onValueChange, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) => {
  const [inner, setInner] = React.useState(defaultValue);
  const current = value ?? inner;
  const id = React.useId();
  const context = React.useMemo(() => ({ value: current, id }), [current, id]);
  return (
    <TabsValueContext.Provider value={context}>
      <TabsPrimitive.Root
        value={current}
        onValueChange={(next) => {
          if (value === undefined) setInner(next);
          onValueChange?.(next);
        }}
        {...props}
      />
    </TabsValueContext.Provider>
  );
};

/** Soulignement de l'onglet actif : 2 px b600 posés sur le filet, partagé entre onglets (`layoutId`). */
const ActiveUnderline = ({ group }: { group: string }) => (
  <motion.span
    aria-hidden="true"
    layoutId={`${group}-onglet-actif`}
    transition={springs.indicator}
    className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-0.5 bg-primary"
  />
);

export const TabsList = ({ className, size = 'md', ...props }: React.ComponentProps<typeof TabsPrimitive.List> & { size?: TabSize }) => (
  <TabsSizeContext.Provider value={size}>
    <TabsPrimitive.List className={cn(listClass(size), className)} {...props} />
  </TabsSizeContext.Provider>
);

export const TabsTrigger = ({
  className,
  count,
  children,
  countPill = false,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & { count?: number; countPill?: boolean }) => {
  const size = React.useContext(TabsSizeContext);
  const tabs = React.useContext(TabsValueContext);
  // Hors de <Tabs> (racine Radix directe) : soulignement par la bordure, sans glissement.
  const sliding = tabs !== null;
  return (
    <TabsPrimitive.Trigger
      className={cn(
        triggerBase(size),
        'group relative data-[state=active]:font-semibold data-[state=active]:text-ink',
        !sliding && 'data-[state=active]:border-primary',
        className,
      )}
      {...props}
    >
      {sliding && tabs.value === props.value && <ActiveUnderline group={tabs.id} />}
      {children}
      {count !== undefined &&
        (countPill ? (
          <span className="tnum inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-2 px-1.5 text-12 font-semibold text-ink-2 group-data-[state=active]:bg-tint-100 group-data-[state=active]:text-tint-800">
            {count}
          </span>
        ) : (
          <span className="tnum text-13 font-normal text-ink-3 group-data-[state=active]:text-primary-strong">{count}</span>
        ))}
    </TabsPrimitive.Trigger>
  );
};

export const TabsContent = TabsPrimitive.Content;

/** Variante navigation : chaque onglet est un lien (URL = état, spec §3). */
export const TabLinks = ({
  items,
  label,
  size = 'md',
  countPill = false,
  className,
}: {
  items: { href: string; label: string; active: boolean; count?: number }[];
  label: string;
  size?: TabSize;
  /** Compteurs en pilule. */
  countPill?: boolean;
  className?: string;
}) => (
  <nav aria-label={label} className={cn(listClass(size), className)}>
    {items.map((item) => (
      <NextLink
        key={item.href}
        href={item.href}
        aria-current={item.active ? 'page' : undefined}
        className={cn(triggerBase(size), 'hover:no-underline', item.active && cn(activeClass, 'hover:text-ink'))}
      >
        {item.label}
        {item.count !== undefined && <Count value={item.count} active={item.active} pill={countPill} />}
      </NextLink>
    ))}
  </nav>
);
