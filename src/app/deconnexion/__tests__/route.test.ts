import { NextRequest } from 'next/server';

import { POST } from '@/app/deconnexion/route';

const signOut = vi.fn();
vi.mock('@/lib/auth', () => ({ signOut: (...args: unknown[]) => signOut(...args) }));
vi.mock('next-auth/jwt', () => ({ getToken: vi.fn().mockResolvedValue({ idToken: 'ID_TOKEN' }) }));

const originalEnv = { ...process.env };

describe('Route /deconnexion', () => {
  beforeEach(() => {
    signOut.mockReset();
    signOut.mockResolvedValue(undefined);
    process.env = { ...originalEnv };
    delete process.env.AUTH_URL;
    delete process.env.NEXTAUTH_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('supprime la session Auth.js et renvoie l’adresse de fin de session Keycloak', async () => {
    const response = await POST(new NextRequest('http://localhost:3000/deconnexion', { method: 'POST' }));
    expect(signOut).toHaveBeenCalledWith({ redirect: false });
    const { redirectTo } = (await response.json()) as { redirectTo: string };
    expect(redirectTo).toContain('/protocol/openid-connect/logout');
    expect(redirectTo).toContain('id_token_hint=ID_TOKEN');
  });

  it('construit post_logout_redirect_uri depuis l’adresse publique AUTH_URL, pas l’origine interne', async () => {
    process.env.AUTH_URL = 'https://app.jangubi.sn';
    // La requête arrive avec l'origine interne du conteneur (derrière Traefik).
    const response = await POST(new NextRequest('https://0.0.0.0:3000/deconnexion', { method: 'POST' }));
    const { redirectTo } = (await response.json()) as { redirectTo: string };
    const uri = new URL(redirectTo).searchParams.get('post_logout_redirect_uri');
    expect(uri).toBe('https://app.jangubi.sn/');
  });

  it('à défaut de configuration, utilise les en-têtes x-forwarded-* du proxy', async () => {
    const response = await POST(
      new NextRequest('https://0.0.0.0:3000/deconnexion', {
        method: 'POST',
        headers: { 'x-forwarded-host': 'app.jangubi.sn', 'x-forwarded-proto': 'https' },
      }),
    );
    const { redirectTo } = (await response.json()) as { redirectTo: string };
    const uri = new URL(redirectTo).searchParams.get('post_logout_redirect_uri');
    expect(uri).toBe('https://app.jangubi.sn/');
  });
});
