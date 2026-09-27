import { http, HttpResponse } from 'msw';

import { api, ApiError, configureApiAuth, errorMessageOf } from '@/lib/api-client';
import { apiUrl } from '@/testing/mocks/api-url';
import { server } from '@/testing/mocks/server';

afterEach(() => configureApiAuth({ accessToken: async () => null, onUnauthorized: () => {} }));

describe('api-client', () => {
  it('ajoute le Bearer de la session', async () => {
    let auth: string | null = null;
    server.use(
      http.get(apiUrl('/ping/'), ({ request }) => {
        auth = request.headers.get('authorization');
        return HttpResponse.json({ ok: true });
      }),
    );
    configureApiAuth({ accessToken: async () => 'jeton', onUnauthorized: () => {} });

    await api.get('/ping/');

    expect(auth).toBe('Bearer jeton');
  });

  it('signale un 401 et renvoie un message sûr', async () => {
    const onUnauthorized = vi.fn();
    server.use(http.get(apiUrl('/ping/'), () => HttpResponse.json({ detail: 'Jeton expiré.' }, { status: 401 })));
    configureApiAuth({ accessToken: async () => 'jeton', onUnauthorized });

    await expect(api.get('/ping/')).rejects.toMatchObject({ status: 401, message: 'Jeton expiré.' });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('traduit une panne réseau en message lisible', async () => {
    server.use(http.get(apiUrl('/ping/'), () => HttpResponse.error()));

    const error = await api.get('/ping/').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toMatch(/pas de connexion/i);
  });
});

describe('errorMessageOf', () => {
  it('lit l’enveloppe V1 {error: {message}}', async () => {
    const { errorMessageOf } = await import('@/lib/api-client');
    expect(errorMessageOf({ error: { code: 'slot_taken', message: 'Ce créneau vient d’être pris.' } }, 409)).toBe(
      'Ce créneau vient d’être pris.',
    );
  });
});

describe('401 puis nouvel essai', () => {
  it('rafraîchit la session et rejoue la requête une seule fois', async () => {
    let calls = 0;
    server.use(
      http.get(apiUrl('/me/'), ({ request }) => {
        calls += 1;
        return request.headers.get('authorization') === 'Bearer neuf'
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json({ detail: 'Jeton expiré.' }, { status: 401 });
      }),
    );
    configureApiAuth({ accessToken: async () => (calls === 0 ? 'vieux' : 'neuf'), onUnauthorized: async () => 'neuf' });

    await expect(api.get('/me/')).resolves.toEqual({ ok: true });
    expect(calls).toBe(2);
  });

  it('ne boucle pas : un second 401 est renvoyé à l’appelant', async () => {
    let calls = 0;
    server.use(
      http.get(apiUrl('/me/'), () => {
        calls += 1;
        return HttpResponse.json({ detail: 'Refusé.' }, { status: 401 });
      }),
    );
    configureApiAuth({ accessToken: async () => 'jeton', onUnauthorized: async () => 'jeton' });

    await expect(api.get('/me/')).rejects.toMatchObject({ status: 401 });
    expect(calls).toBe(2);
  });

  it('sans session, pas de nouvel essai', async () => {
    let calls = 0;
    server.use(
      http.get(apiUrl('/me/'), () => {
        calls += 1;
        return HttpResponse.json({ detail: 'Non authentifié.' }, { status: 401 });
      }),
    );
    configureApiAuth({ accessToken: async () => null, onUnauthorized: async () => null });

    await expect(api.get('/me/')).rejects.toMatchObject({ status: 401 });
    expect(calls).toBe(1);
  });
});

describe('errorMessageOf : limitation de débit (429)', () => {
  it('traduit le message DRF en français avec le délai en minutes', () => {
    const body = { detail: 'Request was throttled. Expected available in 879 seconds.' };
    expect(errorMessageOf(body, 429)).toBe('Trop de tentatives. Réessayez dans 15 minutes.');
  });

  it('donne un message générique sans délai connu', () => {
    expect(errorMessageOf({ error: { code: 'throttled', message: 'Request was throttled.' } }, 429)).toBe(
      'Trop de tentatives. Réessayez un peu plus tard.',
    );
  });

  it('dit « 1 minute » pour un délai court', () => {
    expect(errorMessageOf({ detail: 'Request was throttled. Expected available in 20 seconds.' }, 429)).toBe(
      'Trop de tentatives. Réessayez dans 1 minute.',
    );
  });
});
