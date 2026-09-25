import NextAuth from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';

import { keycloakClientId, keycloakIssuer, needsRefresh, refreshAccessToken } from '@/lib/keycloak-token';

declare module 'next-auth' {
  interface Session {
    /** Jeton d'accès Keycloak, exposé au client pour l'API et le ticket WebSocket (ADR-F02). */
    accessToken?: string;
    error?: 'RefreshTokenError';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    error?: 'RefreshTokenError';
  }
}

/**
 * Auth.js v5 + Keycloak (client public `jangubi-web`, PKCE S256). La session vit dans un cookie
 * httpOnly chiffré ; aucun jeton n'est écrit dans le stockage du navigateur.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/connexion' },
  providers: [
    Keycloak({
      clientId: keycloakClientId(),
      clientSecret: undefined,
      issuer: keycloakIssuer(),
      client: { token_endpoint_auth_method: 'none' },
      checks: ['pkce', 'state'],
      authorization: { params: { scope: 'openid email profile' } },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          expiresAt: account.expires_at,
          error: undefined,
        };
      }
      return needsRefresh(token) ? refreshAccessToken(token) : token;
    },
    async session({ session, token }) {
      // Ni refresh token ni id token côté client : seul le jeton d'accès, à durée courte.
      return { ...session, accessToken: token.accessToken, error: token.error };
    },
  },
});
