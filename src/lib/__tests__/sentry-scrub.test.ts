import type { ErrorEvent } from '@sentry/nextjs';

import { scrubBreadcrumb, scrubEvent, scrubUrl } from '@/lib/sentry-scrub';

describe('sentry-scrub', () => {
  it('retire les paramètres et masque les identifiants d’une URL', () => {
    expect(scrubUrl('https://jangubi.sn/app/demandes/412?motif=mariage')).toBe('https://jangubi.sn/app/demandes/:id');
    expect(scrubUrl('/app/pretres/conversations/0b7b1f0e-0000-4000-8000-000000000001')).toBe('/app/pretres/conversations/:id');
  });

  it('ne laisse sortir ni utilisateur, ni corps, ni en-têtes, ni contact', () => {
    const event = {
      type: undefined,
      user: { email: 'marie@example.sn', id: '42' },
      request: { url: '/app/demandes/12?x=1', method: 'POST', data: '{"motif":"mariage"}', headers: { cookie: 'authjs=…' } },
      message: 'Écrire à marie@example.sn ou au +221 77 412 36 58',
      exception: { values: [{ type: 'ApiError', value: 'Échec pour marie@example.sn' }] },
    } as unknown as ErrorEvent;

    const out = scrubEvent(event);

    expect(out.user).toBeUndefined();
    expect(out.request).toEqual({ method: 'POST', url: '/app/demandes/:id' });
    expect(out.message).toBe('Écrire à [e-mail] ou au [téléphone]');
    expect(out.exception?.values?.[0].value).toBe('Échec pour [e-mail]');
  });

  it('supprime les fils d’Ariane console et les corps des requêtes', () => {
    expect(scrubBreadcrumb({ category: 'console', message: 'Marie Diouf' })).toBeNull();
    expect(scrubBreadcrumb({ category: 'fetch', data: { url: '/api/v1/me/?a=1', body: 'secret' } })).toEqual({
      category: 'fetch',
      message: undefined,
      data: { url: '/api/v1/me/' },
    });
  });
});
