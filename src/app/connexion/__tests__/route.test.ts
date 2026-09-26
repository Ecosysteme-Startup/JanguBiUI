import { NextRequest } from 'next/server';

import { GET } from '@/app/connexion/route';

const signIn = vi.fn();
vi.mock('@/lib/auth', () => ({ signIn: (...args: unknown[]) => signIn(...args) }));

describe('Route /connexion', () => {
  beforeEach(() => signIn.mockReset());

  it('renvoie une erreur de connexion Auth.js vers la page d’erreur, sans relancer Keycloak en boucle', async () => {
    const response = await GET(new NextRequest('http://localhost:3000/connexion?error=OAuthCallbackError'));

    expect(signIn).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/connexion/erreur?error=OAuthCallbackError&redirectTo=%2Fapp');
  });

  it('lance la connexion Keycloak vers une destination interne', async () => {
    signIn.mockResolvedValue(new Response(null, { status: 302 }));
    await GET(new NextRequest('http://localhost:3000/connexion?redirectTo=%2Fapp%2Fdemandes'));

    expect(signIn).toHaveBeenCalledWith('keycloak', { redirectTo: '/app/demandes' }, undefined);
  });
});
