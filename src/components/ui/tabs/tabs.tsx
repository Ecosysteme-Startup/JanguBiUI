'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { LayoutGroup, motion } from 'motion/react';
import * as React from 'react';

import { springs } from '@/lib/motion/tokens';
import { cn } from '@/utils/cn';

/**
 * Valeur active partagée avec les déclencheurs, pour dessiner l'indicateur
 * (pastille) qui glisse d'un onglet à l'autre avec le ressort de la barre
 * d'onglets mobile (damping 18, mass 0,7, stiffness 190) via `layoutId`.
 */
const TabsValueContext = React.createContext<string | undefined>(undefined);

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ value, defaultValue, onValueChange, ...props }, ref) => {
  const [inner, setInner] = React.useState(defaultValue);
  const current = value ?? inner;
  const id = React.useId();
  return (
    <TabsValueContext.Provider value={current}>
      <LayoutGroup id={id}>
        <TabsPrimitive.Root
          ref={ref}
          value={current}
          onValueChange={(v) => {
            setInner(v);
            onValueChange?.(v);
          }}
          {...props}
        />
      </LayoutGroup>
    </TabsValueContext.Provider>
  );
});
Tabs.displayName = TabsPrimitive.Root.displayName;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, value, ...props }, ref) => {
  const active = React.useContext(TabsValueContext) === value;
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      className={cn(
        'relative inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground',
        className,
      )}
      {...props}
    >
      {active && (
        <motion.span
          aria-hidden
          layoutId="tabs-indicator"
          transition={springs.indicator}
          className="absolute inset-0 rounded-sm bg-background shadow-sm"
        />
      )}
      <span className="relative">{children}</span>
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
