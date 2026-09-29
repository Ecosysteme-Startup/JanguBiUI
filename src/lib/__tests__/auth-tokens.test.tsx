import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import * as React from 'react';

import { env } from '@/config/env';
import {
  api,
  ApiError,
  clearSession,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  setSessionTokens,
} from '@/lib/api-client';
import {
  getUser,
  pastoralRoleFromMe,
  roleFromCapacites,
  useLogout,
  userFromMe,
} from '@/lib/auth';
import {
  buildAuthorizationUrl,
  buildEndSessionUrl,
  exchangeCallback,
  oidcEndpoints,
  pkceChallenge,
  readSession,
} from '@/lib/oidc';
import { CAPACITES_DEMO, meDemo } from '@/testing/mocks/handlers/auth';
import { server } from '@/testing/mocks/server';

const TOKEN_URL = oidcEndpoints().token;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

beforeEach(() => {
  clearSession();
  sessionStorage.clear();
});

describe('OIDC Keycloak (Authorization Code + PKCE)', () => {
  test('défi PKCE S256 = base64url(SHA-256(vérificateur))', async () => {
    expect(
      await pkceChallenge('dBjftJeZ4CK1-gFRERssaA0jOMlhN4DjU-RlUxfvMrbN6Q'),
    ).toBe('2qb9ijk5ruzzQDClhClerV6jFDeM5Cgc2_PXRGnLpKs');
  });

  test('URL d’autorisation : client public, code, PKCE S256, state, nonce', async () => {
    const url = new URL(
      await buildAuthorizationUrl({ redirectTo: '/app/dons/analyse' }),
    );
    expect(`${url.origin}${url.pathname}`).toBe(oidcEndpoints().authorization);
    const p = url.searchParams;
    expect(p.get('client_id')).toBe('jangubi-web');
    expect(p.get('response_type')).toBe('code');
    expect(p.get('redirect_uri')).toBe(
      `${window.location.origin}/auth/callback`,
    );
    expect(p.get('code_challenge_method')).toBe('S256');
    expect(p.get('code_challenge')).toMatch(/^[\w-]{43}$/);
    expect(p.get('scope')).toBe('openid profile email');
    expect(p.get('state')).toBeTruthy();
    expect(p.get('nonce')).toBeTruthy();
    expect(p.has('prompt')).toBe(false);
  });

  test('inscription : même flux avec prompt=create', async () => {
    const url = new URL(await buildAuthorizationUrl({ action: 'register' }));
    expect(url.searchParams.get('prompt')).toBe('create');
  });

  test('rappel : échange du code avec le vérificateur, destination conservée', async () => {
    const url = new URL(
      await buildAuthorizationUrl({ redirectTo: '/app/ecouter' }),
    );
    const state = url.searchParams.get('state')!;
    const nonce = url.searchParams.get('nonce')!;
    let corps: URLSearchParams | null = null;
    server.use(
      http.post(TOKEN_URL, async ({ request }) => {
        corps = new URLSearchParams(await request.text());
        return HttpResponse.json({
          access_token: 'acces-1',
          expires_in: 600,
          refresh_token: 'refresh-1',
          refresh_expires_in: 43200,
          id_token: `e30.${btoa(JSON.stringify({ nonce }))}.sig`,
        });
      }),
    );
    const { tokens, redirectTo } = await exchangeCallback(
      new URLSearchParams({ code: 'abc', state }),
    );
    expect(redirectTo).toBe('/app/ecouter');
    expect(tokens.access_token).toBe('acces-1');
    const envoye = corps as URLSearchParams | null;
    expect(envoye?.get('grant_type')).toBe('authorization_code');
    expect(envoye?.get('code')).toBe('abc');
    expect(envoye?.get('client_id')).toBe('jangubi-web');
    expect(envoye?.get('code_verifier')).toMatch(/^[\w-]{64}$/);

    setSessionTokens(tokens);
    expect(getAccessToken()).toBe('acces-1');
    expect(getRefreshToken()).toBe('refresh-1');
    // L'accès reste en mémoire ; le rafraîchissement dans l'onglet.
    const stocke = sessionStorage.getItem('jb_oidc_session') ?? '';
    expect(stocke).toContain('refresh-1');
    expect(stocke).not.toContain('acces-1');
    clearSession();
  });

  test('rappel : state inconnu refusé (pas d’échange)', async () => {
    await expect(
      exchangeCallback(new URLSearchParams({ code: 'abc', state: 'inconnu' })),
    ).rejects.toMatchObject({ code: 'invalid_state' });
  });

  test('rappel : nonce différent refusé', async () => {
    const url = new URL(await buildAuthorizationUrl());
    server.use(
      http.post(TOKEN_URL, () =>
        HttpResponse.json({
          access_token: 'a',
          id_token: `e30.${btoa(JSON.stringify({ nonce: 'autre' }))}.s`,
        }),
      ),
    );
    await expect(
      exchangeCallback(
        new URLSearchParams({
          code: 'c',
          state: url.searchParams.get('state')!,
        }),
      ),
    ).rejects.toMatchObject({ code: 'invalid_nonce' });
  });

  test('fin de session : end_session avec id_token_hint, retour à l’accueil', () => {
    const url = new URL(buildEndSessionUrl('id-tok'));
    expect(`${url.origin}${url.pathname}`).toBe(oidcEndpoints().endSession);
    expect(url.searchParams.get('id_token_hint')).toBe('id-tok');
    expect(url.searchParams.get('post_logout_redirect_uri')).toBe(
      `${window.location.origin}/`,
    );
  });
});

describe('api-client : Bearer Keycloak, rafraîchissement, erreurs V1', () => {
  test('Authorization: Bearer quand un jeton est présent', async () => {
    setAccessToken('my-bearer-token');
    let recu: string | null = null;
    server.use(
      http.get(`${env.API_URL}/v1/me/`, ({ request }) => {
        recu = request.headers.get('authorization');
        return HttpResponse.json(meDemo());
      }),
    );
    await api.get('/v1/me/');
    expect(recu).toBe('Bearer my-bearer-token');
  });

  test('401 → rafraîchissement auprès de Keycloak puis relance', async () => {
    setAccessToken('expire');
    setRefreshToken('refresh-ok');
    const vus: (string | null)[] = [];
    let grant: string | null = null;
    server.use(
      http.get(`${env.API_URL}/v1/me/`, ({ request }) => {
        const auth = request.headers.get('authorization');
        vus.push(auth);
        if (auth === 'Bearer expire') {
          return HttpResponse.json(
            {
              error: {
                code: 'token_expired',
                message: 'Jeton expiré.',
                details: {},
              },
            },
            { status: 401 },
          );
        }
        return HttpResponse.json(meDemo());
      }),
      http.post(TOKEN_URL, async ({ request }) => {
        const form = new URLSearchParams(await request.text());
        grant = `${form.get('grant_type')}:${form.get('refresh_token')}`;
        return HttpResponse.json({
          access_token: 'neuf',
          expires_in: 600,
          refresh_token: 'refresh-2',
        });
      }),
    );
    const me = await api.get<{ email: string }>('/v1/me/');
    expect(me.email).toBe('marie-therese.diouf@example.sn');
    expect(grant).toBe('refresh_token:refresh-ok');
    expect(vus).toEqual(['Bearer expire', 'Bearer neuf']);
    expect(getRefreshToken()).toBe('refresh-2');
    clearSession();
  });

  test('rafraîchissement refusé : la session locale est oubliée', async () => {
    setAccessToken('expire');
    setRefreshToken('expired');
    server.use(
      http.get(`${env.API_URL}/v1/me/`, () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    );
    await expect(api.get('/v1/me/')).rejects.toBeInstanceOf(ApiError);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  test('format d’erreur V1 : message et code', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/staff/dons/analyse/`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'mfa_required',
              message: 'Double authentification requise.',
              details: {},
            },
          },
          { status: 403 },
        ),
      ),
    );
    await expect(
      api.get('/v1/staff/dons/analyse/', { quiet: true }),
    ).rejects.toMatchObject({
      status: 403,
      code: 'mfa_required',
      message: 'Double authentification requise.',
    });
  });
});

describe('useUser : /v1/me/ + /v1/me/capacites/', () => {
  test('fidèle : pas de capacité, rôle fidèle, profil du contrat', async () => {
    const user = await getUser();
    expect(user.email).toBe('marie-therese.diouf@example.sn');
    expect(user.role).toBe('fidele');
    expect(user.capabilities).toEqual([]);
    expect(user.profile.first_name).toBe('Marie-Thérèse');
    expect(user.paroisse_suivie?.name).toBe('Saint-Dominique');
  });

  test('économe : capacités dons, rôle d’interface paroissial', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/me/capacites/`, () =>
        HttpResponse.json(CAPACITES_DEMO['cecile.coly@saint-dominique.sn']),
      ),
    );
    const user = await getUser();
    expect(user.capabilities).toContain('dons.voir_fonds');
    expect(user.role).toBe('parish_admin');
    expect(user.is_admin).toBe(true);
  });

  test('capacités refusées faute d’OTP : accès fidèle, mfa_required signalé', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/me/capacites/`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'mfa_required',
              message: 'OTP requis.',
              details: {},
            },
          },
          { status: 403 },
        ),
      ),
    );
    const user = await getUser();
    expect(user.capabilities).toEqual([]);
    expect(user.mfa_required).toBe(true);
  });

  test('rôle et identité pastorale dérivés', () => {
    expect(
      roleFromCapacites(CAPACITES_DEMO['moustoifa.ben@numerisen.sn']),
    ).toBe('super_admin');
    expect(
      roleFromCapacites(CAPACITES_DEMO['bernard.coly@archidiocese-dakar.sn']),
    ).toBe('diocese_admin');
    expect(
      pastoralRoleFromMe(
        meDemo({ degre_ordre: 'pretre', statut_verification: 'verifie' }),
      ),
    ).toBe('pretre');
    // Déclaré mais non vérifié : aucun effet.
    expect(pastoralRoleFromMe(meDemo({ degre_ordre: 'pretre' }))).toBeNull();
    expect(userFromMe(meDemo(), []).onboarding_state).toBe('completed');
  });
});

describe('useLogout', () => {
  test('oublie la session et part sur la fin de session Keycloak', async () => {
    const assign = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { origin: original.origin, pathname: '/app', search: '', assign },
    });
    try {
      setSessionTokens({
        access_token: 'tok',
        refresh_token: 'ref',
        id_token: 'id-tok',
      });
      expect(readSession()?.id_token).toBe('id-tok');
      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(),
      });
      act(() => result.current.mutate());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      const cible = new URL(assign.mock.calls[0][0] as string);
      expect(cible.pathname).toMatch(/\/protocol\/openid-connect\/logout$/);
      expect(cible.searchParams.get('id_token_hint')).toBe('id-tok');
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: original,
      });
    }
  });
});
