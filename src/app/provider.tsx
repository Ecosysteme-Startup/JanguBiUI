'use client';

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { ThemeProvider } from 'next-themes';
import * as React from 'react';

import { Toaster } from '@/components/ui/toast';
import { AuthProvider } from '@/lib/auth-bridge';
import { onLogoutBroadcast } from '@/lib/logout-channel';
import { queryConfig } from '@/lib/react-query';

/**
 * Déconnexion propagée entre onglets (JB-WEB-041) : à la réception d'un signal de déconnexion
 * d'un autre onglet, on vide le cache React Query puis on renvoie à l'accueil.
 */
const LogoutSync = () => {
  const queryClient = useQueryClient();
  React.useEffect(
    () =>
      onLogoutBroadcast(() => {
        queryClient.clear();
        window.location.assign('/');
      }),
    [queryClient],
  );
  return null;
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = React.useState(() => new QueryClient({ defaultOptions: queryConfig }));
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {/* reducedMotion="user" : les animations `motion` de transform sont coupées quand le
          système demande de réduire les animations (l'opacité est conservée). */}
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <LogoutSync />
            {children}
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
      </MotionConfig>
    </ThemeProvider>
  );
};
