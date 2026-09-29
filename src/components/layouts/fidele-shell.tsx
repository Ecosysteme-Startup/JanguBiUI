'use client';

import type { ReactNode } from 'react';

import { AppFrame, TopbarText } from '@/components/layouts/app-frame';
import { BottomNav } from '@/components/layouts/bottom-nav';
import { FideleSidebar } from '@/components/layouts/fidele-sidebar';
import { OnboardingGate } from '@/components/layouts/onboarding-gate';
import { PlayerRoot, PlayerSpacer } from '@/components/player/player-root';
import { longDate } from '@/utils/dates';

/**
 * Coquille de l'espace fidèle (WEB-FID-*) : barre latérale 264 px, barre supérieure (date du jour,
 * notifications), <main> 1120 px max. Sous 1024 px : tiroir « Menu » et barre de cinq entrées en bas.
 * Le lecteur audio global de la sonothèque se pose au-dessus de la barre du bas.
 */
export const FideleShell = ({ children }: { children: ReactNode }) => (
  <>
    <OnboardingGate />
    <AppFrame sidebar={<FideleSidebar />} topbarFallback={<TopbarText>{longDate(new Date())}</TopbarText>} bottomNav={<BottomNav />}>
      {children}
      <PlayerSpacer />
    </AppFrame>
    {/* Lecteur audio global (sonothèque) : monté une fois, il survit à la navigation. */}
    <PlayerRoot />
  </>
);
