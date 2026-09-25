import { http, HttpResponse } from 'msw';

import { keycloakIssuer, needsRefresh, refreshAccessToken } from '@/lib/keycloak-token';
import { server } from '@/testing/mocks/server';

const tokenUrl = `${keycloakIssuer()}/protocol/openid-connect/token`;

describe('needsRefresh', () => {
  it('rafraîchit 30 s avant l’expiration, pas avant', () => {
    expect(needsRefresh({ expiresAt: 1000 }, 960)).toBe(false);
    expect(needsRefresh({ expiresAt: 1000 }, 975)).toBe(true);
  });
});

describe('refreshAccessToken', () => {
  it('échange le refresh token sans secret client (client public PKCE)', async () => {
    let body = '';
    server.use(
      http.post(tokenUrl, async ({ request }) => {
        body = await request.text();
        return HttpResponse.json({ access_token: 'neuf', expires_in: 300, refresh_token: 'r2' });
      }),
    );

    const token = await refreshAccessToken({ accessToken: 'vieux', refreshToken: 'r1', idToken: 'id' });

    expect(token).toMatchObject({ accessToken: 'neuf', refreshToken: 'r2', idToken: 'id', error: undefined });
    const params = new URLSearchParams(body);
    expect(params.get('grant_type')).toBe('refresh_token');
    expect(params.get('client_id')).toBe('jangubi-web');
    expect(params.has('client_secret')).toBe(false);
  });

  it('marque la session en erreur si Keycloak refuse (session expirée)', async () => {
    server.use(http.post(tokenUrl, () => HttpResponse.json({ error: 'invalid_grant' }, { status: 400 })));

    expect(await refreshAccessToken({ refreshToken: 'mort' })).toMatchObject({ error: 'RefreshTokenError' });
  });
});
