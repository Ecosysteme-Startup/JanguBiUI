'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type * as React from 'react';

/**
 * Infobulle (WEB-Design-System) : fond encre, 13/18, délai 300 ms. Complète une icône, ne
 * remplace jamais un libellé (le déclencheur garde son `aria-label`).
 */
export const Tooltip = ({ content, children, side = 'top' }: { content: React.ReactNode; children: React.ReactElement; side?: 'top' | 'bottom' | 'left' | 'right' }) => (
  <TooltipPrimitive.Provider delayDuration={300}>
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className="data-[state=open]:animate-jb-pop-in data-[state=closed]:animate-jb-pop-out origin-[var(--radix-tooltip-content-transform-origin)] z-50 rounded-8 bg-inverse px-2.5 py-1.5 text-13 text-on-inverse shadow-menu"
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-inverse" width={10} height={5} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  </TooltipPrimitive.Provider>
);
