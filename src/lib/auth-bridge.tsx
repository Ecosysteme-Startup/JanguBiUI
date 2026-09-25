'use client';

import { getSession, SessionProvider, useSession } from 'next-auth/react';
import { type ReactNode, useEffect, useRef } from 'react';

import { paths } from '@/config/paths';
import { configureApiAuth } from '@/lib/api-client';

const redirectToLogin = () => {
  const { pathname, search } = window.location;
  window.location.assign(paths.auth.connexion.getHref(`${pathname}${search}`));
};

/**
 * Relie la session Auth.js au client API : le jeton d'accès vit en mémoire (jamais dans le
 * stockage du navigateur). Un 401 relance la session (refresh côté serveur) ; si le refresh
 * échoue, retour à la connexion.
 */
const ApiAuthBridge = () => {
  const { data: session } = useSession();
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = session?.accessToken ?? null;

  useEffect(() => {
    if (session?.error === 'RefreshTokenError') redirectToLogin();
  }, [session?.error]);

  useEffect(() => {
    let refreshing: Promise<unknown> | null = null;
    configureApiAuth({
      accessToken: async () => tokenRef.current,
      onUnauthorized: () => {
        if (!tokenRef.current || refreshing) return;
        refreshing = getSession().then((fresh) => {
          refreshing = null;
          if (!fresh?.accessToken || fresh.error) redirectToLogin();
          else tokenRef.current = fresh.accessToken;
        });
      },
    });
  }, []);

  return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => (
  <SessionProvider refetchInterval={4 * 60} refetchOnWindowFocus>
    <ApiAuthBridge />
    {children}
  </SessionProvider>
);
