import { http, HttpResponse } from 'msw';

import { api, ApiError, configureApiAuth } from '@/lib/api-client';
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
